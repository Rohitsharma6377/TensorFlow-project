const express = require('express');
const multer = require('multer');
const auth = require('../middleware/auth');
const { uploadFile } = require('../utils/uploads');

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

// POST /api/v1/uploads (multipart/form-data)
// fields: file (single), folder (optional)
router.post('/', auth(), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const folder = req.body.folder || 'uploads';
    const result = await uploadFile({ buffer: req.file.buffer, originalname: req.file.originalname, folder });
    return res.status(201).json({ success: true, ...result });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ success: false, message: 'Upload failed' });
  }
});

module.exports = router;
