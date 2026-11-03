using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using TodoApi;

var builder = WebApplication.CreateBuilder(args);

// הסיסמה למסד ומפתח ה-JWT נשמרים ב-User Secrets (בסביבת פיתוח) או במשתני סביבה - לא בקוד
var connectionString = builder.Configuration.GetConnectionString("ToDoDB");
var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(connectionString) || string.IsNullOrWhiteSpace(jwtKey))
    throw new InvalidOperationException(
        "Missing ConnectionStrings:ToDoDB or Jwt:Key. Set them with 'dotnet user-secrets set'.");

builder.Services.AddDbContext<ToDoDbContext>(options =>
    options.UseMySql(
        connectionString,
        ServerVersion.Parse("8.0.46-mysql")));

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

// ---- JWT ----
var jwtIssuer = builder.Configuration["Jwt:Issuer"];
var jwtAudience = builder.Configuration["Jwt:Audience"];
var signingKey = new SymmetricSecurityKey(
    Encoding.UTF8.GetBytes(jwtKey));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = true,
            ValidAudience = jwtAudience,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = signingKey
        };
    });
builder.Services.AddAuthorization();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    // כפתור Authorize ב-Swagger להדבקת הטוקן
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "הדבק כאן את הטוקן שהתקבל מ-/login"
    });
    c.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        [new OpenApiSecuritySchemeReference("Bearer", document)] = new List<string>()
    });
});

var app = builder.Build();

app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.UseSwagger();
app.UseSwaggerUI();

// יצירת טוקן למשתמש
string CreateToken(User user)
{
    var handler = new JsonWebTokenHandler();
    return handler.CreateToken(new SecurityTokenDescriptor
    {
        Subject = new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username)
        }),
        Expires = DateTime.UtcNow.AddHours(2),
        Issuer = jwtIssuer,
        Audience = jwtAudience,
        SigningCredentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256)
    });
}

var hasher = new PasswordHasher<User>();

// ---- הרשמה ----
app.MapPost("/register", async (ToDoDbContext db, LoginRequest req) =>
{
    var username = req.Username?.Trim() ?? "";
    var password = req.Password ?? "";
    if (username.Length == 0 || username.Length > 100)
        return Results.BadRequest("Username is required (up to 100 characters)");
    if (password.Length < 6)
        return Results.BadRequest("Password must be at least 6 characters");

    if (await db.Users.AnyAsync(u => u.Username == username))
        return Results.Conflict("Username already exists");

    var user = new User { Username = username };
    user.Password = hasher.HashPassword(user, password);
    db.Users.Add(user);
    try
    {
        await db.SaveChangesAsync();
    }
    catch (DbUpdateException)
    {
        // שתי הרשמות באותו שם בדיוק באותו רגע - האינדקס הייחודי במסד עוצר את השנייה
        return Results.Conflict("Username already exists");
    }

    return Results.Ok(new { token = CreateToken(user) });
});

// ---- התחברות ----
app.MapPost("/login", async (ToDoDbContext db, LoginRequest req) =>
{
    if (string.IsNullOrWhiteSpace(req.Username) || string.IsNullOrEmpty(req.Password))
        return Results.BadRequest("Username and password are required");

    var username = req.Username.Trim();
    var user = await db.Users.FirstOrDefaultAsync(u => u.Username == username);
    if (user is null) return Results.Unauthorized();

    var result = hasher.VerifyHashedPassword(user, user.Password, req.Password);
    if (result == PasswordVerificationResult.Failed) return Results.Unauthorized();

    return Results.Ok(new { token = CreateToken(user) });
});

// ---- Items (מוגנים - רק עם טוקן, וכל משתמש רואה רק את המשימות שלו) ----

// שליפת מזהה המשתמש מהטוקן
int GetUserId(ClaimsPrincipal user) =>
    int.Parse((user.FindFirst(ClaimTypes.NameIdentifier) ?? user.FindFirst("nameid") ?? user.FindFirst("sub"))!.Value);

app.MapGet("/items", async (ToDoDbContext db, ClaimsPrincipal user) =>
{
    var userId = GetUserId(user);
    return await db.Items.Where(i => i.UserId == userId).ToListAsync();
}).RequireAuthorization();

app.MapPost("/items", async (ToDoDbContext db, ClaimsPrincipal user, Item item) =>
{
    item.Name = item.Name?.Trim();
    if (string.IsNullOrEmpty(item.Name) || item.Name.Length > 100)
        return Results.BadRequest("Task name is required (up to 100 characters)");

    item.Id = 0;
    item.IsComplete ??= false;
    item.UserId = GetUserId(user); // המשימה תמיד שייכת למשתמש המחובר
    db.Items.Add(item);
    await db.SaveChangesAsync();
    return Results.Created($"/items/{item.Id}", item);
}).RequireAuthorization();

app.MapPut("/items/{id}", async (ToDoDbContext db, ClaimsPrincipal user, int id, Item updated) =>
{
    var userId = GetUserId(user);
    var item = await db.Items.FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId);
    if (item is null) return Results.NotFound();

    // מעדכנים רק את השדות שנשלחו
    if (updated.Name != null)
    {
        var name = updated.Name.Trim();
        if (name.Length == 0 || name.Length > 100)
            return Results.BadRequest("Task name is required (up to 100 characters)");
        item.Name = name;
    }
    if (updated.IsComplete != null)
        item.IsComplete = updated.IsComplete;
    await db.SaveChangesAsync();
    return Results.NoContent();
}).RequireAuthorization();

app.MapDelete("/items/{id}", async (ToDoDbContext db, ClaimsPrincipal user, int id) =>
{
    var userId = GetUserId(user);
    var item = await db.Items.FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId);
    if (item is null) return Results.NotFound();

    db.Items.Remove(item);
    await db.SaveChangesAsync();
    return Results.NoContent();
}).RequireAuthorization();

app.Run();

// המבנה של בקשת הרשמה/התחברות
record LoginRequest(string? Username, string? Password);