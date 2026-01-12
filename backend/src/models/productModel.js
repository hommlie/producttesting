const { pool } = require("../../db");

exports.getAllProducts = async () => {
    const [rows] = await pool.query(`
    SELECT p.*, s.subcategory_name, c.category_name 
    FROM products p
    JOIN subcategories s ON p.subcategory_id = s.id
    JOIN categories c ON s.category_id = c.id
    WHERE p.status = 1
    ORDER BY p.sort_order ASC, p.id DESC
  `);
    return rows;
};

exports.getProductById = async (id) => {
    const [rows] = await pool.query(`
    SELECT p.*, s.subcategory_name, c.category_name 
    FROM products p
    JOIN subcategories s ON p.subcategory_id = s.id
    JOIN categories c ON s.category_id = c.id
    WHERE p.id = ?
  `, [id]);
    return rows[0];
};

exports.createProduct = async (data) => {
    const {
        user_id,
        subcategory_id,
        product_name,
        product_image,
        product_desc,
        contains,
        product_price,
        product_discount_price,
        tax_percentage,
        estimated_time,
        product_status,
        status,
        sort_order
    } = data;

    const sql = `INSERT INTO products (
    user_id, subcategory_id, product_name, product_image, product_desc, 
    contains, product_price, product_discount_price, tax_percentage, 
    estimated_time, product_status, status, sort_order
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const params = [
        user_id,
        subcategory_id,
        product_name,
        product_image,
        product_desc,
        contains,
        product_price,
        product_discount_price || 0.00,
        tax_percentage || 0,
        estimated_time,
        product_status !== undefined ? product_status : 1,
        status !== undefined ? status : 1,
        sort_order || 9999
    ];

    const [result] = await pool.query(sql, params);
    return result.insertId;
};

exports.updateProduct = async (id, data) => {
    const fields = [];
    const params = [];

    // Map keys to database column names if they differ, or just use them directly
    const fieldMapping = {
        subcategory_id: 'subcategory_id',
        product_name: 'product_name',
        product_image: 'product_image',
        product_desc: 'product_desc',
        contains: 'contains',
        product_price: 'product_price',
        product_discount_price: 'product_discount_price',
        tax_percentage: 'tax_percentage',
        estimated_time: 'estimated_time',
        product_status: 'product_status',
        status: 'status',
        sort_order: 'sort_order'
    };

    for (const [key, value] of Object.entries(data)) {
        if (fieldMapping[key] !== undefined && value !== undefined) {
            fields.push(`${fieldMapping[key]} = ?`);
            params.push(value);
        }
    }

    if (fields.length === 0) return null;

    const sql = `UPDATE products SET ${fields.join(", ")} WHERE id = ?`;
    params.push(id);

    const [result] = await pool.query(sql, params);
    return result;
};

exports.deleteProduct = async (id) => {
    // Soft delete
    const [result] = await pool.query("UPDATE products SET status = 0 WHERE id = ?", [id]);
    return result;
};
