import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function AdminAddBook() {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [stock, setStock] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/books', {
        title,
        author,
        price: Number(price),
        description,
        stock: Number(stock),
      });
      alert('Your new book has been added!');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'We could not add this book. Please make sure you have admin access.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page narrow-page">
      <header className="page-intro">
        <p className="eyebrow">A new story for the shelves</p>
        <h1 className="page-title">Add a book</h1>
        <p className="page-description">Fill in the details to welcome a new book to the shop.</p>
      </header>

      <form onSubmit={handleSubmit} className="content-card form-stack">
        {error && <div className="form-error" role="alert">{error}</div>}
        <div className="form-field">
          <label className="form-label" htmlFor="book-title">Book title</label>
          <input
            id="book-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="form-control"
            required
          />
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="book-author">Author</label>
          <input
            id="book-author"
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="form-control"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-field">
            <label className="form-label" htmlFor="book-price">Price (THB)</label>
            <input
              id="book-price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="form-control"
              required
            />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="book-stock">Stock quantity</label>
            <input
              id="book-stock"
              type="number"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="form-control"
              required
            />
          </div>
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="book-description">Description</label>
          <textarea
            id="book-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="form-control form-textarea"
            rows={4}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="button form-submit"
        >
          {loading ? 'Adding your book...' : <>Add book to the shelves <span aria-hidden="true">→</span></>}
        </button>
      </form>
    </main>
  );
}