import multer from "multer";
import fs from "fs";
import path from "path";

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

export const upload = multer({ storage });