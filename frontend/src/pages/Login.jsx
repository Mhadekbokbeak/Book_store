import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'We could not log you in. Please check your details and try again.');
    }
  };

  return (
    <main className="account-page">
      <form onSubmit={handleSubmit} className="account-panel">
        <p className="eyebrow">Your reading nook missed you</p>
        <h1 className="page-title">Welcome back!</h1>
        {error && <div className="form-error" role="alert">{error}</div>}

        <div className="form-stack">
          <div className="form-field">
            <label className="form-label" htmlFor="login-email">Email address</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-control"
              autoComplete="email"
              required
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-control"
              autoComplete="current-password"
              required
            />
          </div>

          <button type="submit" className="button form-submit">
            Log in <span aria-hidden="true">→</span>
          </button>
        </div>

        <p className="account-footer">
          New around here? <Link to="/register" className="text-link">Create an account</Link>
        </p>
      </form>
    </main>
  );
}