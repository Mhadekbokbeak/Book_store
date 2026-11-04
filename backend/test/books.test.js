const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startTestServer, stopTestServer, request, createUser } = require('./helpers');

describe('categories and books', () => {
          let admin;
          let user;
          let categoryId;

          before(async () => {
                    await startTestServer('books');
                    admin = await createUser({ admin: true });
                    user = await createUser();
          });
          after(stopTestServer);

          const createBook = (body) => request('POST', '/books', {
                    token: admin.token,
                    body: { title: 'Book', author: 'Author', price: 100, stock: 5, category: categoryId, ...body },
          });

          it('only admins can create categories; duplicates are 409', async () => {
                    const asUser = await request('POST', '/categories', { token: user.token, body: { name: 'Fiction' } });
                    const created = await request('POST', '/categories', { token: admin.token, body: { name: 'Fiction' } });
                    const duplicate = await request('POST', '/categories', { token: admin.token, body: { name: 'Fiction' } });

                    assert.equal(asUser.status, 403);
                    assert.equal(created.status, 201);
                    assert.equal(duplicate.status, 409);
                    categoryId = created.body._id;
          });

          it('validates book input', async () => {
                    const missingCategory = await createBook({ category: '64b000000000000000000000' });
                    const badCategoryId = await createBook({ category: 'abc' });
                    const fractionalStock = await createBook({ stock: 1.5 });
                    const negativePrice = await createBook({ price: -1 });
                    const badCover = await createBook({ coverImage: 'javascript:alert(1)' });

                    assert.equal(missingCategory.status, 400);
                    assert.equal(badCategoryId.status, 400);
                    assert.equal(fractionalStock.status, 400);
                    assert.equal(negativePrice.status, 400);
                    assert.equal(badCover.status, 400);
          });

          it('updates only whitelisted fields', async () => {
                    const created = await createBook({ title: 'Original' });
                    const updated = await request('PUT', `/books/${created.body._id}`, {
                              token: admin.token,
                              body: { title: 'Renamed', createdAt: '2000-01-01T00:00:00.000Z' },
                    });

                    assert.equal(updated.status, 200);
                    assert.equal(updated.body.title, 'Renamed');
                    assert.equal(updated.body.createdAt, created.body.createdAt);
          });

          it('search is safe with regex characters, and pagination is bounded', async () => {
                    await createBook({ title: 'C++ (2nd edition)' });

                    const special = await request('GET', `/books?keyword=${encodeURIComponent('C++ (2nd')}`);
                    const bigLimit = await request('GET', '/books?limit=100000');
                    const negativePage = await request('GET', '/books?page=-3');

                    assert.equal(special.status, 200);
                    assert.equal(special.body.books.length, 1);
                    assert.equal(bigLimit.status, 200);
                    assert.ok(bigLimit.body.pages >= 1);
                    assert.equal(negativePage.status, 200);
                    assert.equal(negativePage.body.page, 1);
          });

          it('returns 400 for an invalid book id and 404 for a missing one', async () => {
                    const invalid = await request('GET', '/books/not-an-id');
                    const missing = await request('GET', '/books/64b000000000000000000000');

                    assert.equal(invalid.status, 400);
                    assert.equal(missing.status, 404);
          });

          it('cannot delete a category that still has books', async () => {
                    const res = await request('DELETE', `/categories/${categoryId}`, { token: admin.token });
                    assert.equal(res.status, 409);
          });

          it('deleting a book removes it from carts', async () => {
                    const book = await createBook({ title: 'Soon deleted' });
                    await request('POST', '/cart', { token: user.token, body: { bookId: book.body._id } });

                    const deleted = await request('DELETE', `/books/${book.body._id}`, { token: admin.token });
                    const cart = await request('GET', '/cart', { token: user.token });

                    assert.equal(deleted.status, 200);
                    assert.equal(cart.body.items.length, 0);
          });

          it('renames a category, rejects a duplicate or empty name, and keeps other fields unchanged', async () => {
                    const poetry = await request('POST', '/categories', { token: admin.token, body: { name: 'Poetry', description: 'Verse' } });

                    const renamed = await request('PUT', `/categories/${poetry.body._id}`, { token: admin.token, body: { name: 'Poems' } });
                    const duplicate = await request('PUT', `/categories/${poetry.body._id}`, { token: admin.token, body: { name: 'Fiction' } });
                    const empty = await request('PUT', `/categories/${poetry.body._id}`, { token: admin.token, body: { name: '   ' } });
                    const asUser = await request('PUT', `/categories/${poetry.body._id}`, { token: user.token, body: { name: 'Hacked' } });

                    assert.equal(renamed.status, 200);
                    assert.equal(renamed.body.name, 'Poems');
                    assert.equal(renamed.body.description, 'Verse');
                    assert.equal(duplicate.status, 409);
                    assert.equal(empty.status, 400);
                    assert.equal(asUser.status, 403);
          });

          it('an empty category can be deleted', async () => {
                    const empty = await request('POST', '/categories', { token: admin.token, body: { name: 'Empty' } });
                    const res = await request('DELETE', `/categories/${empty.body._id}`, { token: admin.token });
                    assert.equal(res.status, 200);
          });
});
