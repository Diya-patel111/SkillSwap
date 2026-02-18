const multer = require('multer');
const path   = require('path');
const crypto = require('crypto');
const fs     = require('fs');

// ── Ensure the upload directory exists ──────────────────────────────────────
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'avatars');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ── Disk storage strategy ────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),

  filename: (_req, file, cb) => {
    // crypto hex prefix + original extension → collision-proof filenames
    const unique = crypto.randomBytes(16).toString('hex');
    cb(null, `${unique}${path.extname(file.originalname).toLowerCase()}`);
  },
});

// ── Allowed MIME types ────────────────────────────────────────────────────────
const ALLOWED_MIME = /^image\/(jpeg|jpg|png|webp|gif)$/;
const ALLOWED_EXT  = /\.(jpeg|jpg|png|webp|gif)$/i;

const fileFilter = (_req, file, cb) => {
  const validMime = ALLOWED_MIME.test(file.mimetype);
  const validExt  = ALLOWED_EXT.test(path.extname(file.originalname));

  if (validMime && validExt) {
    cb(null, true);
  } else {
    cb(
      Object.assign(new Error('Only image files (jpeg, jpg, png, webp, gif) are allowed'), {
        status: 400,
      }),
    );
  }
};

// ── Multer instance — expects the field name "profileImage" ──────────────────
const uploadProfileImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter,
}).single('profileImage');

// ── Wrap in a middleware that converts multer errors to express next() calls ─
// This ensures multer's "unexpected field" / file-type errors flow through the
// global errorHandler instead of crashing the response with a raw Express error.
const handleUpload = (req, res, next) => {
  uploadProfileImage(req, res, (err) => {
    if (!err) return next();

    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File is too large — maximum size is 5 MB.' });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ message: 'Unexpected file field. Use "profileImage".' });
    }
    // fileFilter or other multer error
    return res.status(err.status || 400).json({ message: err.message });
  });
};

module.exports = { handleUpload };
