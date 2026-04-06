const mongoose = require('mongoose');

const mindMapSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', default: null },
  title: { type: String, required: true, trim: true },
  rootNode: { type: mongoose.Schema.Types.Mixed, required: true },
  isSaved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

mindMapSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('MindMap', mindMapSchema);
