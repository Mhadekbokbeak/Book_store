import { useState, useEffect, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import Modal from '../components/Modal';
import { AuthContext } from '../context/AuthContext';
import { formatPrice, countBooks, sumPrice } from '../utils/format';

const PAGE_SIZE = 12;

const fetchBookPage = (category, page, signal) => api.get('/books', {
  params: { page, limit: PAGE_SIZE, ...(category && { category }) },
  signal,
});

// Add newly loaded books, skipping any already on screen
const appendUnique = (current, incoming) => {
  const seen = new Set(current.map((book) => book._id));
  return [...current, ...incoming.filter((book) => !seen.has(book._id))];
};

export default function Home() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [totalBooks, setTotalBooks] = useState(0);
  const [categories, setCategories] = useState([]);
  // The selected category lives in the URL (/?category=<id>): shareable, and Back works
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategory = searchParams.get('category') || '';
  const [addingId, setAddingId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  // null | { type: 'added', book, quantity, bagCount, bagTotal } | { type: 'login' }
  //      | { type: 'confirm-delete', book } | { type: 'error', message }
  const [popup, setPopup] = useState(null);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    api.get('/categories')
      .then((res) => setCategories(res.data))
      .catch((error) => console.error('Failed to fetch categories', error));
  }, []);

  // First page, again every time the category filter changes
  useEffect(() => {
    // Cancel the old request if the user switches category before it finishes,
    // so a slow old response can never replace the new list
    const controller = new AbortController();

    const fetchFirstPage = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const res = await fetchBookPage(selectedCategory, 1, controller.signal);
        setBooks(res.data.books);
        setTotalBooks(res.data.totalBooks);
      } catch (error) {
        if (controller.signal.aborted) return;
        setBooks([]);
        setTotalBooks(0);
        setLoadError(error.response?.data?.message || 'We could not load the books. Please try again.');
      }
      if (!controller.signal.aborted) setLoading(false);
    };

    fetchFirstPage();
    return () => controller.abort();
  }, [selectedCategory]);

  // The page number comes from how many books are on screen, not a counter.
  // After an admin deletes a book the server's pages shift by one; asking again for the
  // page that now holds the gap (and skipping duplicates) means no book is ever skipped.
  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const res = await fetchBookPage(selectedCategory, Math.floor(books.length / PAGE_SIZE) + 1);
      const merged = appendUnique(books, res.data.books);
      setBooks(merged);
      // Nothing new came back: stop offering "Load more" instead of asking for the same page forever
      setTotalBooks(merged.length === books.length ? merged.length : res.data.totalBooks);
    } catch (error) {
      setPopup({ type: 'error', message: error.response?.data?.message || 'We could not load more books. Please try again.' });
    } finally {
      setLoadingMore(false);
    }
  };

  const selectCategory = (categoryId) => {
    setSearchParams(categoryId ? { category: categoryId } : {});
  };

  const selectedCategoryName = categories.find((category) => category._id === selectedCategory)?.name;

  const addToCart = async (book) => {
    if (!user) {
      setPopup({ type: 'login' });
      return;
    }

    setAddingId(book._id);
    try {
      const res = await api.post('/cart', { bookId: book._id, quantity: 1 });
      const items = res.data.items.filter((item) => item.book);
      const added = items.find((item) => item.book._id === book._id);

      setPopup({
        type: 'added',
        book,
        quantity: added?.quantity ?? 1,
        bagCount: countBooks(items),
        bagTotal: sumPrice(items),
      });
    } catch (error) {
      // 401 = session expired (api.js already logged the user out)
      if (error.response?.status === 401) {
        setPopup({ type: 'login' });
      } else {
        setPopup({ type: 'error', message: error.response?.data?.message || 'We could not add this book. Please try again.' });
      }
    } finally {
      setAddingId(null);
    }
  };

  const closePopup = () => setPopup(null);

  // Admin only. The backend also removes the book from every cart; past orders keep their own copy.
  const deleteBook = async (book) => {
    setDeleting(true);
    try {
      await api.delete(`/books/${book._id}`);
      setBooks((current) => current.filter((item) => item._id !== book._id));
      setTotalBooks((count) => count - 1);
      setPopup(null);
    } catch (error) {
      setPopup({ type: 'error', message: error.response?.data?.message || 'We could not delete this book. Please try again.' });
    } finally {
      setDeleting(false);
    }
  };

  const popupContent = {
    added: popup?.type === 'added' && {
      icon: '♡',
      title: 'Added to your book bag',
      body: (
        <>
          <div className="modal-book">
            <span className="modal-cover" aria-hidden="true">{popup.book.title?.charAt(0) || 'b'}</span>
            <div className="modal-book-info">
              <p className="modal-book-title">{popup.book.title}</p>
              <p className="modal-book-meta">by {popup.book.author}</p>
            </div>
            <span className="modal-book-price">{formatPrice(popup.book.price)} × {popup.quantity}</span>
          </div>
          <dl className="modal-summary">
            <div>
              <dt>In your bag</dt>
              <dd>{popup.bagCount} {popup.bagCount === 1 ? 'book' : 'books'}</dd>
            </div>
            <div>
              <dt>Bag total</dt>
              <dd><strong>{formatPrice(popup.bagTotal)}</strong></dd>
            </div>
          </dl>
        </>
      ),
      actions: (
        <>
          <button type="button" className="button-secondary" onClick={closePopup}>Keep browsing</button>
          <button type="button" className="button" onClick={() => navigate('/cart')} data-autofocus>
            View bag <span aria-hidden="true">→</span>
          </button>
        </>
      ),
    },
    login: {
      icon: '✳',
      title: 'Log in to fill your bag',
      body: <p className="modal-text">Your book bag is saved to your account, so we need to know who you are first.</p>,
      actions: (
        <>
          <button type="button" className="button-secondary" onClick={closePopup}>Not now</button>
          <button type="button" className="button" onClick={() => navigate('/login', { state: { from: '/' } })} data-autofocus>
            Log in <span aria-hidden="true">→</span>
          </button>
        </>
      ),
    },
    'confirm-delete': popup?.type === 'confirm-delete' && {
      icon: '!',
      title: `Delete “${popup.book.title}”?`,
      body: (
        <p className="modal-text">
          It will be removed from the shop and from every customer’s bag. Past orders keep their own copy.
        </p>
      ),
      actions: (
        <>
          {/* Focus starts on the safe choice; the destructive one needs a deliberate tap */}
          <button type="button" className="button-secondary" onClick={closePopup} disabled={deleting} data-autofocus>
            Keep it
          </button>
          <button type="button" className="button-danger" onClick={() => deleteBook(popup.book)} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Yes, delete'}
          </button>
        </>
      ),
    },
    error: {
      icon: '!',
      title: 'That did not work',
      body: <p className="modal-text">{popup?.message}</p>,
      actions: <button type="button" className="button" onClick={closePopup} data-autofocus>OK</button>,
    },
  }[popup?.type];


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
          <h2 className="section-title">{selectedCategoryName || 'Picked with love'}</h2>
        </div>
        {!loading && <span className="section-aside">{totalBooks} {totalBooks === 1 ? 'good read' : 'good reads'}</span>}
      </div>

      {categories.length > 0 && (
        <div className="category-filter" role="group" aria-label="Filter books by category">
          <button
            type="button"
            className="category-chip"
            aria-pressed={!selectedCategory}
            onClick={() => selectCategory('')}
          >
            All books
          </button>
          {categories.map((category) => (
            <button
              key={category._id}
              type="button"
              className="category-chip"
              aria-pressed={selectedCategory === category._id}
              onClick={() => selectCategory(category._id)}
            >
              {category.name}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="loading-state">Finding something lovely to read...</div>
      ) : loadError ? (
        <div className="form-error" role="alert">{loadError}</div>
      ) : books.length === 0 ? (
        <div className="empty-state">
          <span className="empty-doodle" aria-hidden="true">✿</span>
          {selectedCategory ? (
            <>
              <p>No books on this shelf yet.</p>
              <button type="button" className="button" onClick={() => selectCategory('')}>Show all books</button>
            </>
          ) : (
            <>
              <p>Our shelves are taking a little nap.</p>
              <span>Check back soon for something lovely to read.</span>
            </>
          )}
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
                {/* category comes populated from GET /api/books ({ _id, name }); tap it to see that shelf */}
                {book.category ? (
                  <button
                    type="button"
                    className="book-category"
                    onClick={() => selectCategory(book.category._id)}
                    title={`Show all ${book.category.name} books`}
                  >
                    {book.category.name}
                  </button>
                ) : (
                  <span className="book-category book-category-empty">Uncategorized</span>
                )}
                <h2 className="book-title">{book.title}</h2>
                <p className="book-author">by {book.author}</p>
              </div>
              {isAdmin && (
                <div className="book-admin-actions">
                  <button
                    type="button"
                    className="button-danger"
                    onClick={() => setPopup({ type: 'confirm-delete', book })}
                    aria-label={`Delete ${book.title}`}
                  >
                    Delete
                  </button>
                  <span className="book-stock">{book.stock} in stock</span>
                </div>
              )}
              <div className="book-card-footer">
                <span className="book-price">{formatPrice(book.price)}</span>
                <button
                  type="button"
                  onClick={() => addToCart(book)}
                  className="button"
                  disabled={addingId === book._id}
                >
                  {addingId === book._id
                    ? <span>Adding...</span>
                    : <><span>Add to cart</span><span aria-hidden="true">↗</span></>}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {!loading && books.length > 0 && (
        <div className="load-more">
          <span className="load-more-status">Showing {books.length} of {totalBooks}</span>
          {books.length < totalBooks && (
            <button type="button" className="button" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? 'Loading...' : <>Load more books <span aria-hidden="true">↓</span></>}
            </button>
          )}
        </div>
      )}

      <Modal
        open={Boolean(popupContent)}
        onClose={closePopup}
        icon={popupContent?.icon}
        title={popupContent?.title}
        actions={popupContent?.actions}
      >
        {popupContent?.body}
      </Modal>
    </main>
  );
}