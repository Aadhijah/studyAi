const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', default: null },
  title: { type: String, required: true, trim: true },
  content: { type: String, default: '' },
  summary: { type: String, default: '' },
  keyPoints: { type: [String], default: [] },
  tags: { type: [String], default: [] },
  isSaved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

noteSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Note', noteSchema);
