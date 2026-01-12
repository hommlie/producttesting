const express = require("express");
const router = express.Router();

const {
    getProducts,
    getProduct,
    addProduct,
    updateProductData,
    removeProduct
} = require("../src/controllers/productController");
const { upload } = require("../middleware/upload");

router.get("/products", getProducts);
router.get("/products/:id", getProduct);
router.post("/products", upload.single("product_image"), addProduct);
router.put("/products/:id", upload.single("product_image"), updateProductData);
router.delete("/products/:id", removeProduct);

module.exports = router;
