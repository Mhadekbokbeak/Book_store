import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function Profile() {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div className="loading-state">Getting your profile ready...</div>;

  if (!user) {
    return (
      <main className="page narrow-page">
        <div className="empty-state">
          <span className="empty-doodle" aria-hidden="true">♡</span>
          <p>Log in to visit your profile.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page narrow-page">
      <header className="page-intro">
        <p className="eyebrow">A little about you</p>
        <h1 className="page-title">My profile</h1>
      </header>

      <section className="content-card profile-card" aria-label="Profile details">
        <div className="profile-avatar" aria-hidden="true">
          {user.name?.charAt(0) || '♡'}
        </div>
        <div className="profile-details">
          <div className="profile-detail">
            <p className="form-label">Name</p>
            <p className="profile-value">{user.name}</p>
          </div>

          <div className="profile-detail">
            <p className="form-label">Email address</p>
            <p className="profile-value">{user.email}</p>
          </div>

          <div className="profile-detail">
            <p className="form-label">Account type</p>
            <span className="profile-role">
              <span aria-hidden="true">{user.role === 'admin' ? '✦' : '♡'}</span>
              {user.role === 'admin' ? 'Shop admin' : 'Book lover'}
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}