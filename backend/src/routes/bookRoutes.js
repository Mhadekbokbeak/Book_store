const express = require('express');
const router = express.Router();
const { getBooks , getBookById, createBook, updateBook, deleteBook} = require('../controllers/bookController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

router.route('/')
          .get(getBooks)
          .post(protect, admin,createBook);

router.route('/:id')
          .get(getBookById)
          .put(protect, admin,updateBook)
          .delete(protect, admin,deleteBook);
module.exports = router;

