import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { formatPrice, countBooks, sumPrice } from '../utils/format';

export default function Cart() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [removingId, setRemovingId] = useState(null);

  const fetchCart = async () => {
    try {
      const res = await api.get('/cart');
      setCart(res.data);
    } catch (error) {
      console.error('Failed to fetch cart', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const removeItem = async (bookId) => {
    setRemovingId(bookId);
    setError('');
    try {
      const res = await api.delete(`/cart/${bookId}`);
      setCart(res.data);
    } catch {
      setError('We could not remove this book. Please try again.');
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) return   <div className="loading-state">Gathering your books...</div>;

  const items = cart?.items?.filter((item) => item.book) ?? [];

  if (items.length === 0) {
    return (
      <main className="page narrow-page">
        <header className="page-intro">
          <p className="eyebrow">A few stories for later</p>
          <h1 className="page-title">Your book bag</h1>
        </header>
        <div className="empty-state">
          <span className="empty-doodle" aria-hidden="true">♡</span>
          <p>Your book bag is taking a little breather.</p>
          <span>There are plenty of lovely reads waiting for you.</span>
          <Link to="/" className="button">Browse the shelves</Link>
        </div>
      </main>
    );
  }

  const bookCount = countBooks(items);

  return (
    <main className="page narrow-page">
      <header className="page-intro">
        <p className="eyebrow">A few stories for later</p>
        <h1 className="page-title">Your book bag</h1>
      </header>

      {error && <div className="form-error cart-error" role="alert">{error}</div>}

      <section className="content-card" aria-label="Books in your cart">
        {items.map((item) => (
          <div key={item._id} className="cart-item">
            <div>
              <h2 className="cart-item-title">{item.book.title}</h2>
              <p className="cart-item-meta">by {item.book.author}</p>
              <p className="cart-item-meta">{formatPrice(item.book.price)} × {item.quantity}</p>
            </div>
            <button
              type="button"
              onClick={() => removeItem(item.book._id)}
              className="button-danger"
              disabled={removingId === item.book._id}
            >
              {removingId === item.book._id ? 'Removing...' : 'Remove'}
            </button>
          </div>
        ))}
      </section>

      {/* Total on the left, main action on the right. Sticks to the bottom of the screen on phones. */}
      <div className="action-bar">
        <div className="action-bar-total">
          <span>{bookCount} {bookCount === 1 ? 'book' : 'books'}</span>
          <strong>{formatPrice(sumPrice(items))}</strong>
        </div>
        <div className="action-bar-buttons">
          <Link to="/" className="button-secondary">Keep shopping</Link>
          <button type="button" onClick={() => navigate('/checkout')} className="button">
            Checkout <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </main>
  );
}
