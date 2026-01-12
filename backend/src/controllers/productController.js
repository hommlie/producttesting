const {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
} = require("../models/productModel");

exports.getProducts = async (req, res) => {
    try {
        const products = await getAllProducts();
        res.json({ success: true, data: products });
    } catch (error) {
        console.error("Get products error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.getProduct = async (req, res) => {
    try {
        const product = await getProductById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }
        res.json({ success: true, data: product });
    } catch (error) {
        console.error("Get product error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.addProduct = async (req, res) => {
    try {
        const {
            subcategory_id,
            product_name,
            product_desc,
            contains,
            product_price,
            product_discount_price,
            tax_percentage,
            estimated_time,
            sort_order
        } = req.body;

        const image = req.file ? req.file.filename : null;
        const user_id = 1; // Temporary user_id

        // Ensure 'contains' is valid JSON to satisfy DB constraint CHECK (json_valid(`contains`))
        let containsJson = contains;
        try {
            if (typeof contains === 'string') {
                JSON.parse(contains);
            } else {
                containsJson = JSON.stringify(contains || "");
            }
        } catch (e) {
            // If not valid JSON, stringify it
            containsJson = JSON.stringify(contains || "");
        }

        const productId = await createProduct({
            user_id,
            subcategory_id,
            product_name,
            product_image: image,
            product_desc,
            contains: containsJson,
            product_price,
            product_discount_price,
            tax_percentage,
            estimated_time,
            product_status: 1, // Default active
            status: 1, // Default not deleted
            sort_order
        });

        res.status(201).json({
            success: true,
            message: "Product added successfully",
            productId
        });
    } catch (error) {
        console.error("Add product error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.updateProductData = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };

        if (req.file) {
            updateData.product_image = req.file.filename;
        }

        // Ensure 'contains' is valid JSON if provided
        if (updateData.contains !== undefined) {
            try {
                if (typeof updateData.contains === 'string') {
                    JSON.parse(updateData.contains);
                } else {
                    updateData.contains = JSON.stringify(updateData.contains || "");
                }
            } catch (e) {
                updateData.contains = JSON.stringify(updateData.contains || "");
            }
        }

        // Ensure numeric values for status fields
        if (updateData.product_status !== undefined) updateData.product_status = Number(updateData.product_status);
        if (updateData.status !== undefined) updateData.status = Number(updateData.status);

        await updateProduct(id, updateData);
        res.json({ success: true, message: "Product updated successfully" });
    } catch (error) {
        console.error("Update product error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.removeProduct = async (req, res) => {
    try {
        await deleteProduct(req.params.id);
        res.json({ success: true, message: "Product deleted successfully" });
    } catch (error) {
        console.error("Delete product error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
