const express = require("express");
const router = express.Router();

const { addCategory, getCategories, updateCategory } = require("../src/controllers/categoryController");
const { upload } = require("../middleware/upload");

router.post("/categories", upload.single("image"), addCategory);
router.get("/categories", getCategories);
router.put("/categories/:id", upload.single("image"), updateCategory);

module.exports = router;
