const express = require('express');
const router = express.Router();
const cartController = require('../src/controllers/cartController');
const authenticateToken = require('../middleware/authMiddleware');

router.get('/cart', authenticateToken, cartController.getCart);
router.post('/cart/add', authenticateToken, cartController.addItem);
router.post('/cart/update', authenticateToken, cartController.updateItem);
router.post('/cart/remove', authenticateToken, cartController.removeItem);

module.exports = router;
