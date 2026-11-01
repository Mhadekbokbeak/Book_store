import { useState, useEffect } from 'react';
import api from '../services/api';

export default function Home() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const res = await api.get('/books');
        setBooks(res.data.books);
      } catch (error) {
        console.error('Failed to fetch books', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  const addToCart = async (bookId) => {
    try {
      await api.post('/cart', { bookId, quantity: 1 });
      alert('Added to your cart!');
    } catch (error) {
      alert(error.response?.data?.message || 'Please log in before adding a book to your cart.');
    }
  };

  if (loading) return <div className="loading-state">Finding something lovely to read...</div>;

  return (
    <main className="page">
      <header className="shop-hero">
        <div className="hero-copy">
          <p className="eyebrow"><span aria-hidden="true">✳</span> A cozy corner for curious minds</p>
          <h1 className="page-title">Find your next<br />favorite story.</h1>
          <p className="page-description">Good books, thoughtful picks, and a little something for your reading nook.</p>
        </div>
        <div className="hero-doodle" aria-hidden="true">

          <div className="hero-books">
            <span className="hero-book hero-book-one" />
            <span className="hero-book hero-book-two" />
            <span className="hero-book hero-book-three" />
          </div>
          <span className="hero-note">stay<br />curious</span>
        </div>
      </header>

      <div className="section-heading">
        <div>
          <p className="eyebrow">The little bookshop</p>
          <h2 className="section-title">Picked with love</h2>
        </div>
        <span className="section-aside">{books.length} {books.length === 1 ? 'good read' : 'good reads'}</span>
      </div>

      {books.length === 0 ? (
        <div className="empty-state">
          <span className="empty-doodle" aria-hidden="true">✿</span>
          <p>Our shelves are taking a little nap.</p>
          <span>Check back soon for something lovely to read.</span>
        </div>
      ) : (
        <div className="book-grid">
          {books.map((book, index) => (
            <article key={book._id} className="book-card">
              <div className={`book-cover book-cover-${index % 4}`} aria-hidden="true">
                <span className="cover-sparkle">✳</span>
                <span className="cover-art">{book.title?.charAt(0) || 'b'}</span>
                <span className="cover-lines" />
              </div>
              <div>
                <p className="book-number">A LITTLE GEM · {String(index + 1).padStart(2, '0')}</p>
                <h2 className="book-title">{book.title}</h2>
                <p className="book-author">by {book.author}</p>
              </div>
              <div className="book-card-footer">
                <span className="book-price">฿{book.price}</span>
                <button
                  type="button"
                  onClick={() => addToCart(book._id)}
                  className="button"
                >
                  <span>Add to cart</span><span aria-hidden="true">↗</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}