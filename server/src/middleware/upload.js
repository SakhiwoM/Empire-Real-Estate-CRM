const fs = require("fs");
const path = require("path");
const multer = require("multer");

const uploadsRoot = path.join(__dirname, "../../uploads");
const propertyUploadsDir = path.join(uploadsRoot, "properties");

if (!fs.existsSync(propertyUploadsDir)) {
  fs.mkdirSync(propertyUploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, propertyUploadsDir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
    const safeExt = [".jpg", ".jpeg", ".png", ".webp"].includes(ext) ? ext : ".jpg";
    const unique = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    cb(null, `property_${unique}${safeExt}`);
  },
});

function fileFilter(req, file, cb) {
  const isImage = file.mimetype.startsWith("image/");
  if (!isImage) {
    const error = new Error("Only image files are allowed");
    error.status = 400;
    cb(error);
    return;
  }
  cb(null, true);
}

const uploadPropertyImages = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 8 * 1024 * 1024,
    files: 10,
  },
});

module.exports = { uploadPropertyImages, uploadsRoot, propertyUploadsDir };
