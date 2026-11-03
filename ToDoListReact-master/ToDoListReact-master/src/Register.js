import { useNavigate } from 'react-router-dom';
import service from './service';
import AuthForm from './AuthForm';

function Register() {
  const navigate = useNavigate();

  async function register(username, password) {
    try {
      await service.register(username, password);
    } catch (err) {
      const status = err.response?.status;
      throw new Error(
        status === 409 ? 'שם המשתמש כבר תפוס' :
        status === 400 ? (err.response.data || 'פרטים לא תקינים') :
        'אין חיבור לשרת, נסה שוב');
    }
    navigate('/');
  }

  return (
    <AuthForm title="הרשמה" submitText="הירשם" onSubmit={register} minPasswordLength={6}
              footerText="כבר יש לך משתמש?" footerLink="/login" footerLinkText="להתחברות" />
  );
}

export default Register;
