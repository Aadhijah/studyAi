const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const Document = require('../models/Document');
const { extractTextFromFile } = require('../utils/extractText');

const router = express.Router();
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname)),
});

const fileFilter = (_req, file, cb) => {
  const allowed = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.txt'];
  if (allowed.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
  else cb(new Error('Unsupported file type. Allowed: PDF, DOC, DOCX, PPT, PPTX, TXT'));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 20 * 1024 * 1024 } });

router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const extractedText = await extractTextFromFile(req.file.path, req.file.originalname);
    const doc = await new Document({
      userId: req.user._id,
      originalName: req.file.originalname,
      fileName: req.file.filename,
      fileType: path.extname(req.file.originalname).toLowerCase().replace('.', ''),
      fileSize: req.file.size,
      extractedText,
    }).save();
    res.status(201).json({
      _id: doc._id, originalName: doc.originalName, fileType: doc.fileType,
      fileSize: doc.fileSize, textLength: extractedText.length, uploadedAt: doc.uploadedAt,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/', auth, async (req, res) => {
  try {
    const docs = await Document.find({ userId: req.user._id }).select('-extractedText').sort({ uploadedAt: -1 });
    res.json({ documents: docs });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, userId: req.user._id });
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    const fp = path.join(uploadDir, doc.fileName);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
    await Document.deleteOne({ _id: req.params.id });
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
