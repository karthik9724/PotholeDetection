
const multer = require("multer");

const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
];

const upload = multer({
    storage: multer.memoryStorage(),

    limits: {
        fileSize: 5 * 1024 * 1024 // 5 MB maximum
    },

    fileFilter: (req, file, callback) => {
        if (allowedTypes.includes(file.mimetype)) {
            callback(null, true);
        } else {
            callback(
                new Error("Only JPG, PNG and WEBP images are allowed.")
            );
        }
    }
});

module.exports = upload;
