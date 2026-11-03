# ToDo App

אפליקציית משימות: שרת ‎.NET 10 (‏TodoApi) + לקוח React, עם הרשמה/התחברות (JWT) ו-MySQL.

## הרצה במחשב חדש

1. **מסד נתונים** – להריץ ב-MySQL: `CREATE DATABASE ToDoDB;` ואז את הקובץ `db.sql`.
2. **הגדרת סודות לשרת** (פעם אחת, מתוך התיקייה `TodoApi`):
   ```
   dotnet user-secrets set "ConnectionStrings:ToDoDB" "server=localhost;user=root;password=YOUR_PASSWORD;database=ToDoDB"
   dotnet user-secrets set "Jwt:Key" "any-random-secret-key-of-at-least-32-characters"
   ```
3. **הרצת השרת** – בתיקייה `TodoApi`: `dotnet run` (יעלה על http://localhost:5064, ‏Swagger ב-`/swagger`).
4. **הרצת הלקוח** – בתיקייה `ToDoListReact-master/ToDoListReact-master`: `npm install` ואז `npm start` (נפתח על http://localhost:3000).
