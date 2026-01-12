const { pool } = require("../../db");

exports.getAllSubcategories = async () => {
    const sql = `
    SELECT s.*, c.category_name
    FROM subcategories s
    LEFT JOIN categories c ON s.category_id = c.id
    ORDER BY s.id DESC
  `;
    const [rows] = await pool.query(sql);
    return rows;
};

exports.createSubcategory = async (data) => {
    const {
        user_id,
        category_id,
        subcategory_name,
        slug,
        subcategory_image,
        meta_title,
        meta_description,
        subcategory_status,
        status,
        sort_order,
    } = data;

    const sql = `
    INSERT INTO subcategories
    (user_id, category_id, subcategory_name, slug, subcategory_image, meta_title, meta_description, subcategory_status, status, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

    const [result] = await pool.query(sql, [
        user_id,
        category_id,
        subcategory_name,
        slug,
        subcategory_image,
        meta_title,
        meta_description,
        subcategory_status !== undefined ? subcategory_status : 1,
        status !== undefined ? status : 1,
        sort_order || 0,
    ]);
    return result;
};

exports.updateSubcategory = async (id, data) => {
    const fields = [];
    const params = [];

    const mapping = {
        category_id: 'category_id',
        subcategory_name: 'subcategory_name',
        name: 'subcategory_name',
        slug: 'slug',
        subcategory_image: 'subcategory_image',
        meta_title: 'meta_title',
        meta_description: 'meta_description',
        subcategory_status: 'subcategory_status',
        status: 'status',
        sort_order: 'sort_order'
    };

    for (const [key, value] of Object.entries(data)) {
        if (mapping[key] && value !== undefined) {
            fields.push(`${mapping[key]}=?`);
            params.push(value);
        }
    }

    if (fields.length === 0) return null;

    const sql = `UPDATE subcategories SET ${fields.join(', ')} WHERE id=?`;
    params.push(id);

    const [result] = await pool.query(sql, params);
    return result;
};

exports.getSubcategoryById = async (id) => {
    const sql = 'SELECT * FROM subcategories WHERE id=?';
    const [rows] = await pool.query(sql, [id]);
    return rows[0];
};

exports.deleteSubcategoryById = async (id) => {
    const sql = 'DELETE FROM subcategories WHERE id=?';
    const [result] = await pool.query(sql, [id]);
    return result;
};
