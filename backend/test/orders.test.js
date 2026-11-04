const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const Book = require('../src/models/Book');
const Order = require('../src/models/Order');
const { migrateOrders } = require('../scripts/migrateOrders');
const { startTestServer, stopTestServer, request, createUser } = require('./helpers');

const shippingAddress = { address: '1 Main Rd', city: 'Bangkok', postalCode: '01234', country: 'Thailand' };

describe('cart and orders', () => {
          let admin;
          let categoryId;

          before(async () => {
                    await startTestServer('orders');
                    admin = await createUser({ admin: true });
                    const category = await request('POST', '/categories', { token: admin.token, body: { name: 'Test' } });
                    categoryId = category.body._id;
          });
          after(stopTestServer);

          const createBook = async (stock, price = 100) => {
                    const res = await request('POST', '/books', {
                              token: admin.token,
                              body: { title: `Book ${Math.random()}`, author: 'A', price, stock, category: categoryId },
                    });
                    return res.body._id;
          };
          const addToCart = (token, bookId, quantity) => request('POST', '/cart', { token, body: { bookId, quantity } });
          const checkout = (token, body = { shippingAddress }) => request('POST', '/orders', { token, body });

          it('treats quantity "2" as the number 2, not string concatenation', async () => {
                    const user = await createUser();
                    const bookId = await createBook(20);

                    await addToCart(user.token, bookId, 1);
                    const res = await addToCart(user.token, bookId, '2');

                    assert.equal(res.status, 200);
                    assert.equal(res.body.items[0].quantity, 3);
          });

          it('rejects fractional, negative, and over-stock quantities', async () => {
                    const user = await createUser();
                    const bookId = await createBook(3);

                    assert.equal((await addToCart(user.token, bookId, 1.5)).status, 400);
                    assert.equal((await addToCart(user.token, bookId, -1)).status, 400);
                    assert.equal((await addToCart(user.token, bookId, 4)).status, 400);
                    assert.equal((await addToCart(user.token, 'bad-id', 1)).status, 400);
          });

          it('checkout decrements stock, snapshots prices, stores postal code as text, and clears the cart', async () => {
                    const user = await createUser();
                    const bookId = await createBook(5, 19.99);
                    await addToCart(user.token, bookId, 3);

                    const res = await checkout(user.token);
                    const cart = await request('GET', '/cart', { token: user.token });
                    const book = await Book.findById(bookId);

                    assert.equal(res.status, 201);
                    assert.equal(res.body.totalPrice, 59.97);
                    assert.equal(res.body.shippingAddress.postalCode, '01234');
                    assert.equal(res.body.paymentMethod, 'Cash on Delivery');
                    assert.equal(res.body.isDelivered, false);
                    assert.equal(book.stock, 2);
                    assert.equal(cart.body.items.length, 0);
          });

          it('a failed checkout gives back the stock it already took', async () => {
                    const user = await createUser();
                    const first = await createBook(5);
                    const second = await createBook(5);
                    await addToCart(user.token, first, 2);
                    await addToCart(user.token, second, 2);

                    // Someone else buys the second book after it was added to this cart
                    await Book.updateOne({ _id: second }, { stock: 1 });

                    const res = await checkout(user.token);

                    assert.equal(res.status, 409);
                    assert.match(res.body.message, /Insufficient stock/);
                    assert.equal((await Book.findById(first)).stock, 5);
                    assert.equal((await Book.findById(second)).stock, 1);
                    assert.equal(await Order.countDocuments({ user: user.id }), 0);
          });

          it('parallel checkouts cannot oversell the last copy', async () => {
                    const bookId = await createBook(1);
                    const buyers = await Promise.all([createUser(), createUser(), createUser()]);
                    for (const buyer of buyers) await addToCart(buyer.token, bookId, 1);

                    const results = await Promise.all(buyers.map((buyer) => checkout(buyer.token)));
                    const statuses = results.map((res) => res.status).sort();

                    assert.deepEqual(statuses, [201, 409, 409]);
                    assert.equal((await Book.findById(bookId)).stock, 0);
          });

          it('rejects card payments, missing address, and an empty cart', async () => {
                    const user = await createUser();
                    const bookId = await createBook(5);

                    assert.equal((await checkout(user.token)).status, 400); // empty cart

                    await addToCart(user.token, bookId, 1);
                    const card = await checkout(user.token, { shippingAddress, paymentMethod: 'Credit Card' });
                    const noAddress = await checkout(user.token, { paymentMethod: 'Cash on Delivery' });

                    assert.equal(card.status, 400);
                    assert.equal(noAddress.status, 400);
                    assert.equal((await Book.findById(bookId)).stock, 5);
          });

          it('only the owner or an admin can view an order; delivery marks cash orders paid', async () => {
                    const owner = await createUser();
                    const stranger = await createUser();
                    const bookId = await createBook(5);
                    await addToCart(owner.token, bookId, 1);
                    const order = await checkout(owner.token, { shippingAddress, paymentMethod: 'cash on delivery' });

                    assert.equal((await request('GET', `/orders/${order.body._id}`, { token: owner.token })).status, 200);
                    assert.equal((await request('GET', `/orders/${order.body._id}`, { token: stranger.token })).status, 403);
                    assert.equal((await request('GET', `/orders/${order.body._id}`, { token: admin.token })).status, 200);
                    assert.equal((await request('PUT', `/orders/${order.body._id}/delivery`, { token: owner.token })).status, 403);

                    const delivered = await request('PUT', `/orders/${order.body._id}/delivery`, { token: admin.token });
                    assert.equal(delivered.status, 200);
                    assert.equal(delivered.body.isDelivered, true);
                    assert.equal(delivered.body.isPaid, true);
                    assert.ok(delivered.body.deliveryAt);
          });

          it('migration converts legacy order fields and old orders can still be delivered', async () => {
                    const owner = await createUser();
                    // A function, because insertOne adds _id to the object it receives
                    const legacy = () => ({
                              user: new mongoose.Types.ObjectId(owner.id),
                              orderItems: [],
                              shippingAddress: { address: 'a', city: 'b', postalCode: 10110, country: 'c' },
                              paymentMethod: 'Cash on delivery',
                              totalPrice: 0,
                              isPaid: false,
                              idDelivered: true,
                    });
                    const { insertedId } = await mongoose.connection.db.collection('orders').insertOne(legacy());
                    const { insertedId: notMigratedId } = await mongoose.connection.db.collection('orders')
                              .insertOne({ ...legacy(), paymentMethod: 'Credit Card', idDelivered: false });

                    // Before migration, the admin can still deliver an order with a legacy payment method
                    const delivered = await request('PUT', `/orders/${notMigratedId}/delivery`, { token: admin.token });
                    assert.equal(delivered.status, 200);
                    assert.equal(delivered.body.isPaid, false); // not cash on delivery

                    const result = await migrateOrders(mongoose.connection.db);
                    const migrated = await mongoose.connection.db.collection('orders').findOne({ _id: insertedId });
                    const second = await mongoose.connection.db.collection('orders').findOne({ _id: notMigratedId });

                    assert.equal(result.isDelivered, 2);
                    assert.equal(migrated.isDelivered, true);
                    assert.equal(migrated.idDelivered, undefined);
                    assert.equal(migrated.shippingAddress.postalCode, '10110');
                    assert.equal(migrated.paymentMethod, 'Cash on Delivery');
                    // delivered via $set before the migration must stay delivered
                    assert.equal(second.isDelivered, true);
          });
});
