import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Cart() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);

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
    try {
      const res = await api.delete(`/cart/${bookId}`);
      setCart(res.data);
    } catch {
      alert('We could not remove this book. Please try again.');
    }
  };

  if (loading) return   <div className="loading-state">Gathering your books...</div>;

  if (!cart || !cart.items || cart.items.length === 0) {
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

  const totalPrice = cart.items.reduce((sum, item) => sum + (item.book?.price || 0) * item.quantity, 0);

  return (
    <main className="page narrow-page">
      <header className="page-intro">
        <p className="eyebrow">A few stories for later</p>
        <h1 className="page-title">Your book bag</h1>
      </header>

      <section className="content-card" aria-label="Books in your cart">
        {cart.items.map((item) => (
          item.book && (
            <div key={item._id} className="cart-item">
              <div>
                <h2 className="cart-item-title">{item.book.title}</h2>
                <p className="cart-item-meta">by {item.book.author}</p>
                <p className="cart-item-meta">฿{item.book.price} × {item.quantity}</p>
              </div>
              <button
                type="button"
                onClick={() => removeItem(item.book._id)}
                className="button-danger"
              >
                Remove
              </button>
            </div>
          )
        ))}

        <div className="cart-total">
          <span>Your total</span>
          <strong>฿{totalPrice}</strong>
        </div>
      </section>

      <button
        type="button"
        onClick={() => navigate('/checkout')}
        className="button checkout-action"
      >
        Continue to checkout <span aria-hidden="true">→</span>
      </button>
    </main>
  );
}