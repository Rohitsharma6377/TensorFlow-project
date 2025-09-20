const multer = require('multer');
const { uploadFile } = require('../utils/uploads');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

// Middleware that uploads any files from field 'files' (array) or 'file' (single)
// and attaches URLs to req.uploadedUrls
async function attachUploads(req, res, next) {
  try {
    const urls = [];
    const byField = {};
    if (req.files && Array.isArray(req.files)) {
      for (const f of req.files) {
        const result = await uploadFile({ buffer: f.buffer, originalname: f.originalname, folder: req.body.folder || 'uploads' });
        urls.push(result.url);
        if (!byField[f.fieldname]) byField[f.fieldname] = [];
        byField[f.fieldname].push(result.url);
      }
    } else if (req.file) {
      const result = await uploadFile({ buffer: req.file.buffer, originalname: req.file.originalname, folder: req.body.folder || 'uploads' });
      urls.push(result.url);
      if (req.file.fieldname) {
        byField[req.file.fieldname] = [result.url];
      }
    }
    req.uploadedUrls = urls;
    req.uploadedByField = byField;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { upload, attachUploads };
