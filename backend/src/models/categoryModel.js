const { pool } = require("../../db");

exports.getAllCategories = async () => {
    const sql = 'SELECT * FROM categories ORDER BY id DESC';
    const [rows] = await pool.query(sql);
    return rows;
};

exports.createCategory = async (data) => {
    const {
        user_id,
        category_name,
        slug,
        category_image,
        meta_title,
        meta_description,
        category_status,
        status
    } = data;

    const sql = `
    INSERT INTO categories
    (user_id, category_name, slug, category_image, meta_title, meta_description, category_status, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

    const [result] = await pool.query(sql, [
        user_id,
        category_name,
        slug,
        category_image,
        meta_title,
        meta_description,
        category_status !== undefined ? category_status : 1,
        status !== undefined ? status : 1
    ]);

    return result;
};

exports.updateCategory = async (id, data) => {
    const fields = [];
    const params = [];

    const mapping = {
        category_name: 'category_name',
        name: 'category_name',
        slug: 'slug',
        category_image: 'category_image',
        image: 'category_image',
        meta_title: 'meta_title',
        metaTitle: 'meta_title',
        meta_description: 'meta_description',
        metaDescription: 'meta_description',
        category_status: 'category_status',
        status: 'status'
    };

    for (const [key, value] of Object.entries(data)) {
        if (mapping[key] && value !== undefined) {
            fields.push(`${mapping[key]}=?`);
            params.push(value);
        }
    }

    if (fields.length === 0) return null;

    const sql = `UPDATE categories SET ${fields.join(', ')} WHERE id=?`;
    params.push(id);

    const [result] = await pool.query(sql, params);
    return result;
};
