// ฿1,234.5 — also hides floating point noise like 59.970000000000006
export const formatPrice = (value) =>
  `฿${Number(value || 0).toLocaleString('th-TH', { maximumFractionDigits: 2 })}`;

export const countBooks = (items) => items.reduce((sum, item) => sum + item.quantity, 0);

export const sumPrice = (items) =>
  items.reduce((sum, item) => sum + (item.book?.price ?? item.price ?? 0) * item.quantity, 0);
