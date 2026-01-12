const Razorpay = require('razorpay');
const crypto = require('crypto');
const orderModel = require('../models/orderModel');
const cartModel = require('../models/cartModel');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function createOrder(req, res) {
    try {
        const user_id = req.user.id;
        const { payment_method, address } = req.body; // 'COD' or 'ONLINE', + address

        // 1. Get cart items to calculate total
        const cartItems = await cartModel.getCartItems(user_id);
        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart is empty' });
        }

        let totalAmount = 0;
        const orderItems = cartItems.map(item => {
            const price = parseFloat(item.product_discount_price > 0 ? item.product_discount_price : item.product_price);
            totalAmount += price * item.quantity;
            return {
                product_id: item.product_id,
                quantity: item.quantity,
                product_price: price
            };
        });

        // 2. Handle Payment Method
        if (payment_method === 'ONLINE') {
            // Create Razorpay Order
            const options = {
                amount: Math.round(totalAmount * 100), // amount in paise
                currency: 'INR',
                receipt: `receipt_order_${Date.now()}`
            };

            const rzpOrder = await razorpay.orders.create(options);
            if (!rzpOrder) return res.status(500).json({ success: false, message: 'Razorpay order creation failed' });

            // Create Local Order
            const orderId = await orderModel.createOrder({
                user_id,
                total_amount: totalAmount,
                payment_method: 'ONLINE',
                payment_status: 'PENDING',
                order_status: 'PENDING',
                address,
                razorpay_order_id: rzpOrder.id
            });

            await orderModel.addOrderItems(orderId, orderItems);

            return res.json({
                success: true,
                payment_method: 'ONLINE',
                order_id: orderId,
                razorpay_order_id: rzpOrder.id,
                amount: totalAmount,
                key_id: process.env.RAZORPAY_KEY_ID
            });

        } else {
            // COD
            const orderId = await orderModel.createOrder({
                user_id,
                total_amount: totalAmount,
                payment_method: 'COD',
                payment_status: 'PENDING',
                order_status: 'CONFIRMED', // COD orders are confirmed immediately usually
                address,
                razorpay_order_id: null
            });

            await orderModel.addOrderItems(orderId, orderItems);

            // Clear cart
            await cartModel.clearCart(user_id);

            return res.json({
                success: true,
                payment_method: 'COD',
                order_id: orderId,
                message: 'Order placed successfully'
            });
        }

    } catch (err) {
        console.error('Create Order Error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}

async function verifyPayment(req, res) {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature === razorpay_signature) {
            // Signature matched
            await orderModel.updateOrderPayment(order_id, {
                payment_status: 'PAID',
                order_status: 'CONFIRMED',
                razorpay_payment_id,
                razorpay_signature
            });

            // Clear cart after successful payment
            const user_id = req.user.id;
            await cartModel.clearCart(user_id);

            return res.json({ success: true, message: 'Payment verified and order confirmed' });
        } else {
            return res.status(400).json({ success: false, message: 'Invalid signature' });
        }
    } catch (err) {
        console.error('Verify Payment Error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}

async function getMyOrders(req, res) {
    try {
        const orders = await orderModel.getOrdersByUser(req.user.id);
        res.json({ success: true, data: orders });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}

module.exports = { createOrder, verifyPayment, getMyOrders };
