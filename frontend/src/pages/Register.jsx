import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(name, email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'We could not create your account. Please try again.');
    }
  };

  return (
    <main className="account-page">
      <form onSubmit={handleSubmit} className="account-panel">
        <div className="account-sticker" aria-hidden="true">♡</div>
        <p className="eyebrow">There's always room for one more</p>
        <h1 className="page-title">Join our little nook</h1>
        {error && <div className="form-error" role="alert">{error}</div>}

        <div className="form-stack">
          <div className="form-field">
            <label className="form-label" htmlFor="register-name">Your name</label>
            <input
              id="register-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-control"
              autoComplete="name"
              required
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="register-email">Email address</label>
            <input
              id="register-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-control"
              autoComplete="email"
              required
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="register-password">Password</label>
            <input
              id="register-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-control"
              autoComplete="new-password"
              required
            />
          </div>

          <button type="submit" className="button form-submit">
            Create my account <span aria-hidden="true">→</span>
          </button>
        </div>

        <p className="account-footer">
          Already have an account? <Link to="/login" className="text-link">Log in</Link>
        </p>
      </form>
    </main>
  );
}