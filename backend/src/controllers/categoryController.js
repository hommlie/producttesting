const { createCategory, getAllCategories, updateCategory } = require("../models/categoryModel");

// Update category
exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, slug, metaTitle, metaDescription, category_status, status } = req.body;
        const image = req.file ? req.file.filename : null;
        const updateData = {
            category_name: name,
            slug,
            meta_title: metaTitle,
            meta_description: metaDescription,
            category_status,
            status
        };
        if (image) updateData.category_image = image;
        await updateCategory(id, updateData);
        res.json({ success: true, message: "Category updated successfully" });
    } catch (error) {
        console.error("Update category error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Get all categories
exports.getCategories = async (req, res) => {
    try {
        const categories = await getAllCategories();
        res.json({ success: true, categories });
    } catch (error) {
        console.error("Get categories error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.addCategory = async (req, res) => {
    try {
        const { name, slug, metaTitle, metaDescription } = req.body;
        const image = req.file ? req.file.filename : null;

        // TEMP user_id
        const user_id = 1;

        await createCategory({
            user_id,
            category_name: name,
            slug,
            category_image: image,
            meta_title: metaTitle,
            meta_description: metaDescription,
            category_status: 1, // Default
            status: 1, // Default
        });

        res.status(201).json({
            success: true,
            message: "Category added successfully",
        });
    } catch (error) {
        console.error("Add category error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};
