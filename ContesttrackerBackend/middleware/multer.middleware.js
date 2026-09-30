import multer from "multer";
import fs from "fs";
import path from "path";

// Allowed image types only
const ALLOWED_MIME_TYPES = new Set([
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
]);

// Max file size: 5 MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const dir = "./public/temp";
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      cb(null, dir);
    },
    filename: function (req, file, cb) {
      // Generate safe unique filename to avoid special character / spaces issue
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname) || ".png";
      cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    }
});

export const upload = multer({
    storage,
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 1, // max 1 file per field
        fields: 20, // max 20 non-file fields
    },
    fileFilter: function (req, file, cb) {
        if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
            return cb(new Error("Invalid file type. Only image files are allowed."));
        }
        cb(null, true);
    }
});