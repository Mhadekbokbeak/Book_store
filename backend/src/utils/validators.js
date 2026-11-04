const HttpError = require('./httpError');

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Value must be a 24-char hex string (MongoDB ObjectId)
exports.requireObjectId = (value, label = 'id') => {
          if (typeof value !== 'string' || !OBJECT_ID_PATTERN.test(value)) {
                    throw new HttpError(400, `Invalid ${label}`);
          }
          return value;
};

// Trimmed string with a max length. optional: missing value returns undefined
exports.requireString = (value, label, { max = 200, optional = false } = {}) => {
          if (value === undefined || value === null) {
                    if (optional) return undefined;
                    throw new HttpError(400, `${label} is required`);
          }
          if (typeof value !== 'string') {
                    throw new HttpError(400, `${label} must be text`);
          }

          const trimmed = value.trim();
          if (!trimmed && !optional) {
                    throw new HttpError(400, `${label} is required`);
          }
          if (trimmed.length > max) {
                    throw new HttpError(400, `${label} must be at most ${max} characters`);
          }
          return trimmed;
};

exports.requireEmail = (value) => {
          const email = exports.requireString(value, 'Email', { max: 254 }).toLowerCase();
          if (!EMAIL_PATTERN.test(email)) {
                    throw new HttpError(400, 'Email is not valid');
          }
          return email;
};

// Accepts a number or a numeric string ("2"), so "1" + "2" can never become "12"
exports.requireInteger = (value, label, { min, max }) => {
          const number = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
          if (!Number.isInteger(number) || number < min || number > max) {
                    throw new HttpError(400, `${label} must be a whole number between ${min} and ${max}`);
          }
          return number;
};

// Invalid or missing values fall back to defaults; limit is capped
exports.parsePagination = (query, { defaultLimit = 10, maxLimit = 50 } = {}) => {
          const toPositiveInt = (value, fallback) => {
                    const number = Number(value);
                    return Number.isInteger(number) && number > 0 ? number : fallback;
          };

          const page = toPositiveInt(query.page, 1);
          const limit = Math.min(toPositiveInt(query.limit, defaultLimit), maxLimit);
          return { page, limit, skip: (page - 1) * limit };
};

// Make user input safe to use inside a RegExp (prevents regex errors and ReDoS)
exports.escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
