import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function AdminAddBook() {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [categorySuccess, setCategorySuccess] = useState('');
  const [categorySaving, setCategorySaving] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        setCategories(response.data);
      } catch (fetchError) {
        setError(fetchError.response?.data?.message || 'We could not load book categories.');
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    setCategorySaving(true);
    setCategoryError('');
    setCategorySuccess('');

    try {
      const response = await api.post('/categories', {
        name: categoryName.trim(),
        description: categoryDescription.trim(),
      });

      setCategories((currentCategories) =>
        [...currentCategories, response.data].sort((a, b) => a.name.localeCompare(b.name))
      );
      setCategory(response.data._id);
      setCategoryName('');
      setCategoryDescription('');
      setCategorySuccess(`“${response.data.name}” is ready to use for your book.`);
    } catch (createError) {
      setCategoryError(
        createError.response?.data?.message
        || 'We could not create this category. Please try again.'
      );
    } finally {
      setCategorySaving(false);
    }
  };

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
        category,
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

      <section className="content-card admin-category-card">
        <div className="admin-section-heading">
          <div>
            <p className="eyebrow">Organize the shelves</p>
            <h2 className="section-title">Create a category</h2>
          </div>
          <span className="admin-section-icon" aria-hidden="true">✳</span>
        </div>
        <p className="page-description admin-section-description">
          Add a shelf label, then it will be selected for your new book.
        </p>

        <form onSubmit={handleCreateCategory} className="form-stack">
          {categoryError && <div className="form-error" role="alert">{categoryError}</div>}
          {categorySuccess && <div className="form-success" role="status">{categorySuccess}</div>}
          <div className="form-field">
            <label className="form-label" htmlFor="category-name">Category name</label>
            <input
              id="category-name"
              type="text"
              value={categoryName}
              onChange={(event) => {
                setCategoryName(event.target.value);
                setCategoryError('');
                setCategorySuccess('');
              }}
              className="form-control"
              maxLength={80}
              placeholder="For example, Modern classics"
              required
            />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="category-description">Description (optional)</label>
            <textarea
              id="category-description"
              value={categoryDescription}
              onChange={(event) => setCategoryDescription(event.target.value)}
              className="form-control form-textarea"
              maxLength={300}
              rows={3}
              placeholder="A short note about this shelf"
            />
          </div>
          <button
            type="submit"
            disabled={categorySaving || !categoryName.trim()}
            className="button form-submit"
          >
            {categorySaving
              ? 'Creating category...'
              : <>Create category <span aria-hidden="true">→</span></>}
          </button>
        </form>
      </section>

      <section className="admin-book-section">
        <div className="admin-section-heading">
          <div>
            <p className="eyebrow">Add to the collection</p>
            <h2 className="section-title">Book details</h2>
          </div>
        </div>
      <form onSubmit={handleSubmit} className="content-card form-stack admin-book-form">
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

        <div className="form-field">
          <label className="form-label" htmlFor="book-category">Category</label>
          <select
            id="book-category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="form-control"
            required
            disabled={categoriesLoading || categories.length === 0}
          >
            <option value="">
              {categoriesLoading ? 'Loading categories...' : 'Choose a category'}
            </option>
            {categories.map((item) => (
              <option key={item._id} value={item._id}>{item.name}</option>
            ))}
          </select>
          {!categoriesLoading && categories.length === 0 && (
            <p className="form-hint">Create a category before adding books.</p>
          )}
        </div>

        <div className="form-row">
          <div className="form-field">
            <label className="form-label" htmlFor="book-price">Price (THB)</label>
            <input
              id="book-price"
              type="number"
              min="0"
              step="0.01"
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
              min="0"
              step="1"
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
          disabled={loading || categoriesLoading || categories.length === 0}
          className="button form-submit"
        >
          {loading ? 'Adding your book...' : <>Add book to the shelves <span aria-hidden="true">→</span></>}
        </button>
      </form>
      </section>
    </main>
  );
}