const { pool } = require('../../db');

async function findCustomerByPhone(phone) {
  const [rows] = await pool.query('SELECT * FROM customers WHERE phone = ?', [phone]);
  return rows[0];
}

async function createCustomer({ name, phone }) {
  const [result] = await pool.query('INSERT INTO customers (name, phone, created_at) VALUES (?, ?, NOW())', [name, phone]);
  return { id: result.insertId, name, phone };
}

module.exports = { findCustomerByPhone, createCustomer };
