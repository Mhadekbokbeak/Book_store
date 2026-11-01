import { useState, useEffect } from 'react';
import api from '../services/api';

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get('/orders/myorders');
        setOrders(res.data);
      } catch (error) {
        console.error('Failed to fetch orders', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) return <div className="loading-state">Finding your past orders...</div>;

  return (
    <main className="page narrow-page">
      <header className="page-intro">
        <p className="eyebrow">Your little reading life</p>
        <h1 className="page-title">My orders</h1>
      </header>

      {orders.length === 0 ? (
        <div className="empty-state">
          <span className="empty-doodle" aria-hidden="true">✿</span>
          <p>No orders just yet.</p>
          <span>Your next favorite read might be waiting on our shelves.</span>
        </div>
      ) : (
        <div className="order-list">
          {orders.map((order) => (
            <article key={order._id} className="content-card order-card">
              <div className="order-header">
                <span className="order-id">Order #{order._id}</span>
                <span className={`order-status${order.isDelivered ? '' : ' pending'}`}>
                  {order.isDelivered ? 'Delivered' : 'On its way soon'}
                </span>
              </div>

              <div>
                <h2 className="form-label">In this parcel</h2>
                <ul className="order-items">
                  {order.orderItems.map((item, index) => (
                    <li key={index}>
                      <span className="serif-copy">{item.title}</span> (Qty: {item.quantity}) — ฿{item.price * item.quantity}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="order-summary">
                <span>Your total <strong className="order-total">฿{order.totalPrice}</strong></span>
                <span className="order-payment">Paid by {order.paymentMethod}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}