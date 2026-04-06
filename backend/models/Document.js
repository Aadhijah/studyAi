const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  originalName: { type: String, required: true },
  fileName: { type: String, required: true },
  fileType: { type: String, required: true },
  fileSize: { type: Number, default: 0 },
  extractedText: { type: String, default: '' },
  uploadedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Document', documentSchema);
