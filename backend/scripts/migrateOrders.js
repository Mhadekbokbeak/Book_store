// One-time migration for orders created before the Order schema fix:
//   1. idDelivered -> isDelivered (typo in the old field name)
//   2. shippingAddress.postalCode number -> string (leading zeros already lost cannot be recovered)
//   3. "Cash on delivery" (old default) -> "Cash on Delivery"
// Safe to run more than once. Usage: npm run migrate:orders  (uses MONGO_URI from .env)
const mongoose = require('mongoose');

const migrateOrders = async (db) => {
          const orders = db.collection('orders');

          // Keep true if either field says delivered, then drop the old field
          const delivered = await orders.updateMany(
                    { idDelivered: { $exists: true } },
                    [
                              { $set: { isDelivered: { $or: [{ $ifNull: ['$isDelivered', false] }, '$idDelivered'] } } },
                              { $unset: 'idDelivered' },
                    ]
          );

          const postalCodes = await orders.updateMany(
                    { 'shippingAddress.postalCode': { $type: 'number' } },
                    [{ $set: { 'shippingAddress.postalCode': { $toString: '$shippingAddress.postalCode' } } }]
          );

          const paymentMethods = await orders.updateMany(
                    { paymentMethod: 'Cash on delivery' },
                    { $set: { paymentMethod: 'Cash on Delivery' } }
          );

          return {
                    isDelivered: delivered.modifiedCount,
                    postalCode: postalCodes.modifiedCount,
                    paymentMethod: paymentMethods.modifiedCount,
          };
};

if (require.main === module) {
          require('dotenv').config();

          (async () => {
                    try {
                              await mongoose.connect(process.env.MONGO_URI);
                              const result = await migrateOrders(mongoose.connection.db);
                              console.log('Orders migrated:', result);
                    } catch (error) {
                              console.error('Migration failed:', error.message);
                              process.exitCode = 1;
                    } finally {
                              await mongoose.disconnect();
                    }
          })();
}

module.exports = { migrateOrders };
