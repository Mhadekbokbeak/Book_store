import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const sortByName = (items) => [...items].sort((a, b) => a.name.localeCompare(b.name));
const errorMessage = (error, fallback) => error.response?.data?.message || fallback;

// One row: shows a category, or its edit form, or a delete confirmation
function CategoryRow({ category, onUpdated, onDeleted }) {
  const [mode, setMode] = useState('view'); // 'view' | 'edit' | 'confirm-delete'
  const [name, setName] = useState(category.name);
  const [description, setDescription] = useState(category.description || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const startEdit = () => {
    setName(category.name);
    setDescription(category.description || '');
    setError('');
    setMode('edit');
  };

  const cancel = () => {
    setError('');
    setMode('view');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const response = await api.put(`/categories/${category._id}`, {
        name: name.trim(),
        description: description.trim(),
      });
      onUpdated(response.data);
      setMode('view');
    } catch (saveError) {
      setError(errorMessage(saveError, 'We could not save this category.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    setError('');

    try {
      await api.delete(`/categories/${category._id}`);
      onDeleted(category._id);
    } catch (deleteError) {
      // e.g. 409 when books still use this category
      setError(errorMessage(deleteError, 'We could not delete this category.'));
      setMode('view');
      setSaving(false);
    }
  };

  if (mode === 'edit') {
    return (
      <li className="cart-item admin-category-row">
        <form onSubmit={handleSave} className="form-stack admin-category-edit">
          {error && <div className="form-error" role="alert">{error}</div>}
          <div className="form-field">
            <label className="form-label" htmlFor={`category-name-${category._id}`}>Category name</label>
            <input
              id={`category-name-${category._id}`}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-control"
              maxLength={80}
              required
              autoFocus
            />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor={`category-description-${category._id}`}>Description (optional)</label>
            <textarea
              id={`category-description-${category._id}`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-control form-textarea"
              maxLength={300}
              rows={2}
            />
          </div>
          {/* Main action last = right side */}
          <div className="admin-row-actions">
            <button type="button" className="button-secondary" onClick={cancel} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="button" disabled={saving || !name.trim()}>
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="cart-item admin-category-row">
      <div className="admin-category-info">
        <h3 className="cart-item-title">{category.name}</h3>
        <p className="cart-item-meta">{category.description || 'No description'}</p>
        {error && <div className="form-error admin-row-error" role="alert">{error}</div>}
      </div>

      {mode === 'confirm-delete' ? (
        <div className="admin-row-actions" role="group" aria-label={`Confirm deleting ${category.name}`}>
          <span className="admin-confirm-text">Delete this category?</span>
          <button type="button" className="button-secondary" onClick={cancel} disabled={saving}>
            Keep it
          </button>
          <button type="button" className="button-danger" onClick={handleDelete} disabled={saving}>
            {saving ? 'Deleting...' : 'Yes, delete'}
          </button>
        </div>
      ) : (
        // Delete sits away from the right edge so a quick right-thumb tap lands on Edit, not Delete
        <div className="admin-row-actions">
          <button type="button" className="button-danger" onClick={() => { setError(''); setMode('confirm-delete'); }}>
            Delete
          </button>
          <button type="button" className="button-secondary" onClick={startEdit}>Edit</button>
        </div>
      )}
    </li>
  );
}

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        setCategories(response.data);
      } catch (fetchError) {
        setLoadError(errorMessage(fetchError, 'We could not load the categories.'));
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    setCreateSuccess('');

    try {
      const response = await api.post('/categories', {
        name: name.trim(),
        description: description.trim(),
      });
      setCategories((current) => sortByName([...current, response.data]));
      setName('');
      setDescription('');
      setCreateSuccess(`“${response.data.name}” was added.`);
    } catch (error) {
      setCreateError(errorMessage(error, 'We could not create this category.'));
    } finally {
      setCreating(false);
    }
  };

  const handleUpdated = (updated) => {
    setCategories((current) => sortByName(current.map((item) => (item._id === updated._id ? updated : item))));
  };

  const handleDeleted = (id) => {
    setCategories((current) => current.filter((item) => item._id !== id));
  };

  return (
    <main className="page narrow-page">
      <header className="page-intro">
        <p className="eyebrow">Organize the shelves</p>
        <h1 className="page-title">Book categories</h1>
        <p className="page-description">
          Add, rename, or remove categories. A category can be deleted only when no book uses it.
          {' '}<Link to="/admin/add-book" className="text-link">Add a book</Link>
        </p>
      </header>

      <section className="content-card admin-category-card" aria-labelledby="new-category-title">
        <div className="admin-section-heading">
          <div>
            <p className="eyebrow">New shelf label</p>
            <h2 id="new-category-title" className="section-title">Create a category</h2>
          </div>
          <span className="admin-section-icon" aria-hidden="true">✳</span>
        </div>

        <form onSubmit={handleCreate} className="form-stack">
          {createError && <div className="form-error" role="alert">{createError}</div>}
          {createSuccess && <div className="form-success" role="status">{createSuccess}</div>}
          <div className="form-field">
            <label className="form-label" htmlFor="new-category-name">Category name</label>
            <input
              id="new-category-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setCreateError('');
                setCreateSuccess('');
              }}
              className="form-control"
              maxLength={80}
              placeholder="For example, Modern classics"
              required
            />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="new-category-description">Description (optional)</label>
            <textarea
              id="new-category-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-control form-textarea"
              maxLength={300}
              rows={2}
              placeholder="A short note about this shelf"
            />
          </div>
          <button type="submit" disabled={creating || !name.trim()} className="button form-submit">
            {creating ? 'Creating category...' : <>Create category <span aria-hidden="true">→</span></>}
          </button>
        </form>
      </section>

      <section aria-labelledby="category-list-title">
        <div className="section-heading">
          <h2 id="category-list-title" className="section-title">All categories</h2>
          {!loading && <span className="section-aside">{categories.length} total</span>}
        </div>

        {loading && <div className="loading-state">Loading categories...</div>}
        {loadError && <div className="form-error" role="alert">{loadError}</div>}

        {!loading && !loadError && categories.length === 0 && (
          <div className="empty-state">
            <span className="empty-doodle" aria-hidden="true">✿</span>
            <p>No categories yet.</p>
            <span>Create the first one above.</span>
          </div>
        )}

        {categories.length > 0 && (
          <ul className="content-card admin-category-list">
            {categories.map((category) => (
              <CategoryRow
                key={category._id}
                category={category}
                onUpdated={handleUpdated}
                onDeleted={handleDeleted}
              />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
