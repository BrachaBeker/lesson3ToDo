using System;
using System.Collections.Generic;

namespace TodoApi;

public partial class Item
{
    public int Id { get; set; }

    public string? Name { get; set; }

    public bool? IsComplete { get; set; }

    // המשתמש שהמשימה שייכת לו (נקבע בשרת לפי הטוקן, לא לפי מה שהלקוח שולח)
    public int? UserId { get; set; }
}
