const express = require('express');
const router = express.Router();
const orderController = require('../src/controllers/orderController');
const authenticateToken = require('../middleware/authMiddleware');

router.post('/orders/create', authenticateToken, orderController.createOrder);
router.post('/orders/verify', authenticateToken, orderController.verifyPayment);
router.get('/orders/my-orders', authenticateToken, orderController.getMyOrders);

module.exports = router;
