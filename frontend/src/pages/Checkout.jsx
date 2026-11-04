import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Modal from '../components/Modal';
import { formatPrice, countBooks, sumPrice } from '../utils/format';

export default function Checkout() {
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('Thailand');
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState(null); // cart items, for the total shown before ordering
  const [placedOrder, setPlacedOrder] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const res = await api.get('/cart');
        setItems(res.data.items.filter((item) => item.book));
      } catch {
        setItems([]);
      }
    };

    fetchCart();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const shippingAddress = { address, city, postalCode, country };
      const res = await api.post('/orders', { shippingAddress, paymentMethod });
      setPlacedOrder(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'We could not place your order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (items === null) return <div className="loading-state">Getting your order ready...</div>;

  if (items.length === 0 && !placedOrder) {
    return (
      <main className="page narrow-page">
        <div className="empty-state">
          <span className="empty-doodle" aria-hidden="true">♡</span>
          <p>Your book bag is empty, so there is nothing to check out yet.</p>
          <Link to="/" className="button">Browse the shelves</Link>
        </div>
      </main>
    );
  }

  const bookCount = countBooks(items);
  const orderBookCount = placedOrder ? countBooks(placedOrder.orderItems) : 0;

  return (
    <main className="page narrow-page">
      <header className="page-intro">
        <p className="eyebrow">Almost there!</p>
        <h1 className="page-title">Where should we send your books?</h1>
        <p className="page-description">Add your delivery details and we’ll get your happy mail ready.</p>
      </header>

      <form onSubmit={handleSubmit} className="content-card form-stack">
        {error && <div className="form-error" role="alert">{error}</div>}
        <div className="form-field">
          <label className="form-label" htmlFor="shipping-address">Street address</label>
          <input
            id="shipping-address"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="form-control"
            autoComplete="street-address"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-field">
            <label className="form-label" htmlFor="shipping-city">City / province</label>
            <input
              id="shipping-city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="form-control"
              autoComplete="address-level1"
              required
            />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="shipping-postal-code">Postal code</label>
            <input
              id="shipping-postal-code"
              type="text"
              inputMode="numeric"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              className="form-control"
              autoComplete="postal-code"
              required
            />
          </div>
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="shipping-country">Country</label>
          <input
            id="shipping-country"
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="form-control"
            autoComplete="country-name"
            required
          />
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="payment-method">Payment method</label>
          <select
            id="payment-method"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="form-control"
          >
            <option value="Cash on Delivery">Cash on delivery</option>
            {/* No payment gateway yet; the backend rejects card orders */}
            <option value="Credit Card" disabled>Credit or debit card (coming soon)</option>
          </select>
        </div>

        {/* Total on the left, Place order on the right. Sticks to the bottom of the screen on phones. */}
        <div className="action-bar action-bar-in-card">
          <div className="action-bar-total">
            <span>{bookCount} {bookCount === 1 ? 'book' : 'books'} · pay on delivery</span>
            <strong>{formatPrice(sumPrice(items))}</strong>
          </div>
          <div className="action-bar-buttons">
            <Link to="/cart" className="button-secondary">Back to bag</Link>
            <button type="submit" disabled={loading || Boolean(placedOrder)} className="button">
              {loading ? 'Placing order...' : <>Place my order <span aria-hidden="true">→</span></>}
            </button>
          </div>
        </div>
      </form>

      <Modal
        open={Boolean(placedOrder)}
        onClose={() => navigate('/orders')}
        icon="✿"
        title="Your order is in!"
        actions={
          <>
            <button type="button" className="button-secondary" onClick={() => navigate('/')}>Back to shop</button>
            <button type="button" className="button" onClick={() => navigate('/orders')} data-autofocus>
              See my orders <span aria-hidden="true">→</span>
            </button>
          </>
        }
      >
        {placedOrder && (
          <>
            <p className="modal-text">Thank you for supporting our little bookshop. We’ll get your parcel ready soon.</p>
            <dl className="modal-summary">
              <div>
                <dt>Order</dt>
                <dd>#{placedOrder._id.slice(-6).toUpperCase()}</dd>
              </div>
              <div>
                <dt>{orderBookCount} {orderBookCount === 1 ? 'book' : 'books'}</dt>
                <dd><strong>{formatPrice(placedOrder.totalPrice)}</strong></dd>
              </div>
              <div>
                <dt>Payment</dt>
                <dd>{placedOrder.paymentMethod}</dd>
              </div>
              <div>
                <dt>Shipping to</dt>
                <dd>{placedOrder.shippingAddress.city} {placedOrder.shippingAddress.postalCode}</dd>
              </div>
            </dl>
          </>
        )}
      </Modal>
    </main>
  );
}
