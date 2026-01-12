const { pool } = require('../../db');

// Add item to cart or update quantity if exists
async function addToCart({ user_id, product_id, quantity }) {
    // Check if item exists
    const [existing] = await pool.query(
        'SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?',
        [user_id, product_id]
    );

    if (existing.length > 0) {
        const newQuantity = existing[0].quantity + quantity;
        await pool.query(
            'UPDATE cart_items SET quantity = ? WHERE id = ?',
            [newQuantity, existing[0].id]
        );
        return { id: existing[0].id, user_id, product_id, quantity: newQuantity };
    } else {
        // verify product exists to avoid foreign key error if desired, but DB enforces it
        const [result] = await pool.query(
            'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)',
            [user_id, product_id, quantity]
        );
        return { id: result.insertId, user_id, product_id, quantity };
    }
}

// Get cart items for a user
async function getCartItems(user_id) {
    const [rows] = await pool.query(`
    SELECT c.id, c.user_id, c.product_id, c.quantity, p.product_name, p.product_price, p.product_image, p.product_discount_price 
    FROM cart_items c
    JOIN products p ON c.product_id = p.id
    WHERE c.user_id = ?
  `, [user_id]);
    return rows;
}

// Update cart item quantity
async function updateCartItem({ user_id, product_id, quantity }) {
    if (quantity <= 0) {
        return deleteCartItem(user_id, product_id);
    }
    await pool.query(
        'UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?',
        [quantity, user_id, product_id]
    );
    return { user_id, product_id, quantity };
}

// Remove item from cart
async function deleteCartItem(user_id, product_id) {
    await pool.query(
        'DELETE FROM cart_items WHERE user_id = ? AND product_id = ?',
        [user_id, product_id]
    );
    return { success: true };
}

// Clear cart
async function clearCart(user_id) {
    await pool.query('DELETE FROM cart_items WHERE user_id = ?', [user_id]);
    return { success: true };
}

module.exports = { addToCart, getCartItems, updateCartItem, deleteCartItem, clearCart };
