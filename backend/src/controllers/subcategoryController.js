const {
    getAllSubcategories,
    createSubcategory,
    updateSubcategory,
    getSubcategoryById,
    deleteSubcategoryById,
} = require("../models/subcategoryModel");

exports.getSubcategories = async (req, res) => {
    try {
        const subcategories = await getAllSubcategories();
        res.json({ success: true, subcategories });
    } catch (error) {
        console.error("Get subcategories error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.addSubcategory = async (req, res) => {
    try {
        const {
            category_id,
            subcategory_name,
            slug,
            meta_title,
            meta_description,
            subcategory_status,
            status,
            sort_order,
        } = req.body;

        const subcategory_image = req.file ? req.file.filename : null;
        const user_id = 1; // TEMP

        await createSubcategory({
            user_id,
            category_id,
            subcategory_name,
            slug,
            subcategory_image,
            meta_title,
            meta_description,
            subcategory_status: subcategory_status !== undefined ? subcategory_status : 1,
            status: status !== undefined ? status : 1,
            sort_order: sort_order || 0,
        });

        res.status(201).json({
            success: true,
            message: "Subcategory added successfully",
        });
    } catch (error) {
        console.error("Add subcategory error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.updateSubcategory = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            category_id,
            subcategory_name,
            slug,
            meta_title,
            meta_description,
            subcategory_status,
            status,
            sort_order,
        } = req.body;

        const subcategory_image = req.file ? req.file.filename : null;

        const updateData = {
            category_id,
            subcategory_name,
            slug,
            meta_title,
            meta_description,
            subcategory_status,
            status,
            sort_order,
        };
        if (subcategory_image) updateData.subcategory_image = subcategory_image;

        await updateSubcategory(id, updateData);

        res.json({ success: true, message: "Subcategory updated successfully" });
    } catch (error) {
        console.error("Update subcategory error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.deleteSubcategory = async (req, res) => {
    try {
        const { id } = req.params;

        // Get subcategory to find image file
        const subcategory = await getSubcategoryById(id);

        if (!subcategory) {
            return res.status(404).json({ success: false, message: "Subcategory not found" });
        }

        // Delete image file if exists
        if (subcategory.subcategory_image) {
            const fs = require("fs");
            const path = require("path");
            const filePath = path.join(__dirname, "../../uploads/categories", subcategory.subcategory_image);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        // Delete from database
        await deleteSubcategoryById(id);

        res.json({ success: true, message: "Subcategory deleted successfully" });
    } catch (error) {
        console.error("Delete subcategory error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.updateSubcategoryStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (status === undefined) {
            return res.status(400).json({ success: false, message: "Status is required" });
        }

        const updateData = { status };
        await updateSubcategory(id, updateData);

        res.json({ success: true, message: "Status updated successfully" });
    } catch (error) {
        console.error("Update status error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
