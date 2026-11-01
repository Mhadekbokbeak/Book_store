import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Checkout() {
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('Thailand');
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const shippingAddress = { address, city, postalCode, country };
      await api.post('/orders', { shippingAddress, paymentMethod });
      
      alert('Your order is in! Thank you for supporting our little bookshop.');
      navigate('/orders');
    } catch (err) {
      setError(err.response?.data?.message || 'We could not place your order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
            <option value="Credit Card">Credit or debit card</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="button form-submit"
        >
          {loading ? 'Getting your order ready...' : <>Place my order <span aria-hidden="true">→</span></>}
        </button>
      </form>
    </main>
  );
}