const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure directory exists
const uploadDir = path.join(__dirname, "../public/uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // We use the absolute path we resolved above to be safe, 
        // or relative to process cwd if following user snippet exactly.
        // Using absolute path is safer for middleware in subfolder.
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName =
            Date.now() +
            "-" +
            Math.round(Math.random() * 1e9) +
            path.extname(file.originalname);
        cb(null, uniqueName);
    },
});

exports.upload = multer({ storage });
