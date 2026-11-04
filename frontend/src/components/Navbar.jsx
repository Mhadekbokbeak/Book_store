import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useContext, useEffect, useRef, useState } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    const savedTheme = window.localStorage.getItem('bookstore-theme');
    if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('bookstore-theme', theme);
  }, [theme]);

  // The mobile menu is a native <dialog>: Esc closes it and focus stays inside while open
  useEffect(() => {
    const menu = menuRef.current;
    if (menuOpen && !menu.open) menu.showModal();
    if (!menuOpen && menu.open) menu.close();
  }, [menuOpen]);

  // If the window grows to desktop width while the menu is open, close it
  // (otherwise an invisible modal would keep blocking the page)
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 901px)');
    const handleChange = (event) => { if (event.matches) setMenuOpen(false); };
    desktop.addEventListener('change', handleChange);
    return () => desktop.removeEventListener('change', handleChange);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    closeMenu();
    logout();
    navigate('/login');
  };

  // Same links for the desktop bar and the mobile menu; tapping one closes the menu
  const links = (
    <>
      <NavLink to="/" className="nav-link" end onClick={closeMenu}>All books</NavLink>
      {user ? (
        <>
          <NavLink to="/cart" className="nav-link" onClick={closeMenu}>Cart</NavLink>
          <NavLink to="/orders" className="nav-link" onClick={closeMenu}>My orders</NavLink>
          <NavLink to="/profile" className="nav-link" onClick={closeMenu}>My profile</NavLink>
          {user.role === 'admin' && (
            <>
              <NavLink to="/admin/categories" className="nav-link" onClick={closeMenu}>Categories</NavLink>
              <NavLink to="/admin/add-book" className="nav-link nav-link-pill" onClick={closeMenu}>Add a book</NavLink>
            </>
          )}
        </>
      ) : (
        <>
          <NavLink to="/login" className="nav-link" onClick={closeMenu}>Log in</NavLink>
          <NavLink to="/register" className="nav-link nav-link-pill" onClick={closeMenu}>Join us</NavLink>
        </>
      )}
    </>
  );

  const themeToggle = (
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
  );

  return (
    <nav className="site-nav" aria-label="Main navigation">
      <div className="nav-inner">
        <Link to="/" className="brand">
          <span>Soul BookShop</span>
        </Link>

        {/* Wide screens: links in a row */}
        <div className="nav-actions nav-desktop">
          {links}
          {user && (
            <>
              <span className="nav-user">Hi, {user.name}</span>
              <button onClick={handleLogout} className="button-secondary">Sign out</button>
            </>
          )}
          {themeToggle}
        </div>

        {/* Small screens: theme + hamburger, the hamburger in the top-right corner for the right thumb */}
        <div className="nav-mobile-controls">
          {themeToggle}
          <button
            type="button"
            className="menu-toggle"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            <span className="menu-toggle-lines" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </button>
        </div>
      </div>

      {/* Slides in from the right. Clicking the dimmed area outside closes it. */}
      <dialog
        id="mobile-menu"
        ref={menuRef}
        className="nav-drawer"
        aria-label="Menu"
        onCancel={(event) => { event.preventDefault(); closeMenu(); }}
        onClick={(event) => { if (event.target === menuRef.current) closeMenu(); }}
      >
        <div className="nav-drawer-panel">
          <div className="nav-drawer-header">
            <span className="nav-drawer-greeting">{user ? `Hi, ${user.name}` : 'Welcome!'}</span>
            {/* Same spot as the hamburger, so one tap opens and the next closes */}
            <button type="button" className="menu-toggle" onClick={closeMenu} aria-label="Close menu">
              <span aria-hidden="true">×</span>
            </button>
          </div>

          <div className="nav-drawer-links">{links}</div>

          {user && (
            <button onClick={handleLogout} className="button-secondary nav-drawer-signout">Sign out</button>
          )}
        </div>
      </dialog>
    </nav>
  );
}
