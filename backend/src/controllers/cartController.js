const cartModel = require('../models/cartModel');

async function getCart(req, res) {
    try {
        const user_id = req.user.id;
        const items = await cartModel.getCartItems(user_id);
        res.json({ success: true, data: items });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}

async function addItem(req, res) {
    try {
        const user_id = req.user.id;
        const { product_id, quantity } = req.body;
        if (!product_id) return res.status(400).json({ success: false, message: 'product_id required' });

        await cartModel.addToCart({ user_id, product_id, quantity: quantity || 1 });
        const items = await cartModel.getCartItems(user_id);
        res.json({ success: true, data: items });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}

async function updateItem(req, res) {
    try {
        const user_id = req.user.id;
        let { product_id, quantity } = req.body;
        if (!product_id) return res.status(400).json({ success: false, message: 'product_id required' });

        product_id = parseInt(product_id);
        quantity = parseInt(quantity);

        await cartModel.updateCartItem({ user_id, product_id, quantity });
        const items = await cartModel.getCartItems(user_id);
        res.json({ success: true, data: items });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}

async function removeItem(req, res) {
    try {
        const user_id = req.user.id;
        let { product_id } = req.body;
        console.log(`[Cart] Remove Item Request: user=${user_id}, product=${product_id}`);

        if (!product_id) return res.status(400).json({ success: false, message: 'product_id required' });
        product_id = parseInt(product_id);

        const result = await cartModel.deleteCartItem(user_id, product_id);
        console.log(`[Cart] Delete result:`, result);

        const items = await cartModel.getCartItems(user_id);
        res.json({ success: true, data: items });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}

module.exports = { getCart, addItem, updateItem, removeItem };
