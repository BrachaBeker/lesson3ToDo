import { useState } from 'react';
import { Link } from 'react-router-dom';

// טופס משותף להתחברות ולהרשמה
function AuthForm({ title, submitText, onSubmit, footerText, footerLink, footerLinkText, minPasswordLength = 0 }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password) {
      setError('יש למלא שם משתמש וסיסמה');
      return;
    }
    if (password.length < minPasswordLength) {
      setError(`הסיסמה חייבת להכיל לפחות ${minPasswordLength} תווים`);
      return;
    }
    setLoading(true);
    try {
      await onSubmit(username.trim(), password);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <section className="todoapp auth" dir="rtl">
      <form onSubmit={handleSubmit}>
        <h2>{title}</h2>
        <input placeholder="שם משתמש" value={username} autoFocus
               onChange={e => setUsername(e.target.value)} />
        <input type="password" placeholder="סיסמה" value={password}
               onChange={e => setPassword(e.target.value)} />
        <button type="submit" disabled={loading}>{loading ? 'רגע...' : submitText}</button>
        {error && <p className="auth-error">{error}</p>}
        <p>{footerText} <Link to={footerLink}>{footerLinkText}</Link></p>
      </form>
    </section>
  );
}

export default AuthForm;
