import multer from "multer";
import path from "node:path";
import crypto from "node:crypto";

const ALLOWED_MIME = {
  "image/jpeg": "image", "image/png": "image", "image/webp": "image", "image/gif": "image",
  "audio/mpeg": "voice", "audio/ogg": "voice", "audio/wav": "voice", "audio/webm": "voice",
  "audio/mp4": "voice",
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).slice(0, 10);
    const safeName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
    cb(null, safeName);
  },
});

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME[file.mimetype]) {
    return cb(new Error("Unsupported file type. Only images and audio are allowed."));
  }
  cb(null, true);
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
});

export function mediaKindFromMime(mimetype) {
  return ALLOWED_MIME[mimetype] || null;
}
