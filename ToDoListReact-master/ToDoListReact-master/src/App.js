import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import service from './service.js';

function App() {
  const [newTodo, setNewTodo] = useState("");
  const [todos, setTodos] = useState([]);
  const [editingId, setEditingId] = useState(null); // המשימה שנמצאת כרגע בעריכה
  const [editText, setEditText] = useState("");
  const editingRef = useRef(null); // מונע שמירה כפולה (Enter ואחריו blur)

  const navigate = useNavigate();

  async function getTodos() {
    try {
      const todos = await service.getTasks();
      setTodos(todos);
    } catch {
      // השגיאה כבר נרשמה ב-interceptor (ו-401 מפנה להתחברות)
    }
  }

  function logout() {
    service.logout();
    navigate('/login');
  }

  async function createTodo(e) {
    e.preventDefault();
    if (!newTodo.trim()) return; // לא מוסיפים משימה ריקה
    await service.addTask(newTodo.trim());
    setNewTodo("");//clear input
    await getTodos();//refresh tasks list (in order to see the new one)
  }

  async function updateCompleted(todo, isComplete) {
    await service.setCompleted(todo.id, isComplete);
    await getTodos();//refresh tasks list (in order to see the updated one)
  }

  async function deleteTodo(id) {
    await service.deleteTask(id);
    await getTodos();//refresh tasks list
  }

  // ---- עריכת שם משימה (לחיצה כפולה) ----
  function startEdit(todo) {
    editingRef.current = todo.id;
    setEditingId(todo.id);
    setEditText(todo.name || "");
  }

  function cancelEdit() {
    editingRef.current = null;
    setEditingId(null);
    setEditText("");
  }

  async function saveEdit(todo) {
    if (editingRef.current !== todo.id) return; // כבר נשמר/בוטל (למשל Enter ואחריו blur)
    const name = editText.trim();
    cancelEdit();
    if (!name) {
      await deleteTodo(todo.id); // שם ריק = מחיקה, כמו ב-TodoMVC
    } else if (name !== todo.name) {
      await service.renameTask(todo.id, name);
      await getTodos();
    }
  }

  function handleEditKey(e, todo) {
    if (e.key === "Enter") saveEdit(todo);
    else if (e.key === "Escape") cancelEdit();
  }

  useEffect(() => {
    getTodos();
  }, []);

  return (
    <section className="todoapp">
      <header className="header">
        <button className="logout" onClick={logout}>התנתק</button>
        <h1>todos</h1>
        <form onSubmit={createTodo}>
          <input className="new-todo" placeholder="Well, let's take on the day" value={newTodo} onChange={(e) => setNewTodo(e.target.value)} />
        </form>
      </header>
      <section className="main" style={{ display: "block" }}>
        <ul className="todo-list">
          {todos.map(todo => {
            const isEditing = editingId === todo.id;
            const classes = [todo.isComplete ? "completed" : "", isEditing ? "editing" : ""].join(" ").trim();
            return (
              <li className={classes} key={todo.id}>
                <div className="view">
                  <input className="toggle" type="checkbox" checked={!!todo.isComplete} onChange={(e) => updateCompleted(todo, e.target.checked)} />
                  <label onDoubleClick={() => startEdit(todo)} title="לחיצה כפולה לעריכה">{todo.name}</label>
                  <button className="destroy" onClick={() => deleteTodo(todo.id)}></button>
                </div>
                {isEditing && (
                  <input className="edit" autoFocus value={editText}
                         onChange={(e) => setEditText(e.target.value)}
                         onKeyDown={(e) => handleEditKey(e, todo)}
                         onBlur={() => saveEdit(todo)} />
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </section >
  );
}

export default App;
