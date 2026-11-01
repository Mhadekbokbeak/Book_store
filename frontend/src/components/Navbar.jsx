import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => {
    const savedTheme = window.localStorage.getItem('bookstore-theme');
    if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('bookstore-theme', theme);
  }, [theme]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="site-nav" aria-label="Main navigation">
      <div className="nav-inner">
        <Link to="/" className="brand">
          <span>Soul BookShop</span>
        </Link>
        <div className="nav-actions">
          <NavLink to="/" className="nav-link" end>All books</NavLink>

          {user ? (
            <>
              <NavLink to="/cart" className="nav-link">Cart</NavLink>
              <NavLink to="/orders" className="nav-link">My orders</NavLink>
              <NavLink to="/profile" className="nav-link">My profile</NavLink>
              {user.role === 'admin' && (
                <NavLink to="/admin/add-book" className="nav-link nav-link-pill">Add a book</NavLink>
              )}

              <span className="nav-user">Hi, {user.name}</span>
              <button
                onClick={handleLogout}
                className="button-secondary"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="nav-link">Log in</NavLink>
              <NavLink to="/register" className="nav-link nav-link-pill">Join us</NavLink>
            </>
          )}

          <button
            type="button"
            className="theme-toggle"
            onClick={() => setTheme((currentTheme) => currentTheme === 'dark' ? 'light' : 'dark')}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-pressed={theme === 'dark'}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            <span aria-hidden="true">{theme === 'dark' ? '☼' : '◐'}</span>
          </button>
        </div>
      </div>
    </nav>
  );
}