const { pool } = require('../../db');

// Create a new order
async function createOrder(orderData) {
    const {
        user_id,
        total_amount,
        payment_method,
        payment_status,
        order_status,
        address,
        razorpay_order_id
    } = orderData;

    const [result] = await pool.query(
        `INSERT INTO orders 
        (user_id, total_amount, payment_method, payment_status, order_status, address, razorpay_order_id, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
            user_id,
            total_amount,
            payment_method,
            payment_status || 'PENDING',
            order_status || 'PENDING',
            null, // Address removed as per request
            razorpay_order_id || null
        ]
    );
    return result.insertId;
}

// Add items to an order
async function addOrderItems(orderId, items) {
    if (!items || items.length === 0) return;

    const values = items.map(item => [
        orderId,
        item.product_id,
        item.quantity,
        item.product_price,
        item.quantity * item.product_price
    ]);

    await pool.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price, total) VALUES ?`,
        [values]
    );
}

// Get order by ID
async function getOrderById(orderId) {
    const [rows] = await pool.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    return rows[0];
}

// Update order payment status (e.g., after Razorpay success)
async function updateOrderPayment(orderId, { payment_status, order_status, razorpay_payment_id, razorpay_signature }) {
    await pool.query(
        `UPDATE orders SET 
            payment_status = ?, 
            order_status = ?, 
            razorpay_payment_id = ?, 
            razorpay_signature = ? 
        WHERE id = ?`,
        [payment_status, order_status, razorpay_payment_id, razorpay_signature, orderId]
    );
}

// Get orders by user
async function getOrdersByUser(userId) {
    const [rows] = await pool.query(
        `SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`,
        [userId]
    );
    return rows;
}

module.exports = { createOrder, addOrderItems, getOrderById, updateOrderPayment, getOrdersByUser };
