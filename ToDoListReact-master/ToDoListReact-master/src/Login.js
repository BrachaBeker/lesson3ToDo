import { useNavigate } from 'react-router-dom';
import service from './service';
import AuthForm from './AuthForm';

function Login() {
  const navigate = useNavigate();

  async function login(username, password) {
    try {
      await service.login(username, password);
    } catch (err) {
      throw new Error(err.response?.status === 401
        ? 'שם משתמש או סיסמה שגויים'
        : 'אין חיבור לשרת, נסה שוב');
    }
    navigate('/');
  }

  return (
    <AuthForm title="התחברות" submitText="התחבר" onSubmit={login}
              footerText="אין לך משתמש?" footerLink="/register" footerLinkText="להרשמה" />
  );
}

export default Login;
