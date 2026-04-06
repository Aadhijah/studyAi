const express = require('express');
const auth = require('../middleware/auth');
const MindMap = require('../models/MindMap');
const Document = require('../models/Document');
const { generateMindMap } = require('../utils/aiHelper');

const router = express.Router();

router.post('/generate', auth, async (req, res) => {
  try {
    const { documentId, text, title } = req.body;
    let sourceText = text || '';
    if (documentId) {
      const doc = await Document.findOne({ _id: documentId, userId: req.user._id });
      if (!doc) return res.status(404).json({ error: 'Document not found' });
      sourceText = doc.extractedText;
    }
    if (sourceText.trim().length < 50) return res.status(400).json({ error: 'Not enough text (min 50 chars)' });
    const generated = await generateMindMap(sourceText, title || 'Mind Map');
    const mm = await new MindMap({
      userId: req.user._id,
      documentId: documentId || null,
      title: title || 'Generated Mind Map',
      rootNode: generated.rootNode,
      isSaved: false,
    }).save();
    res.status(201).json({ mindMap: mm });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/', auth, async (req, res) => {
  try {
    const filter = { userId: req.user._id };
    if (req.query.saved === 'true') filter.isSaved = true;
    const maps = await MindMap.find(filter).populate('documentId', 'originalName').sort({ updatedAt: -1 });
    res.json({ mindMaps: maps });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const mm = await MindMap.findOne({ _id: req.params.id, userId: req.user._id }).populate('documentId', 'originalName');
    if (!mm) return res.status(404).json({ error: 'Not found' });
    res.json({ mindMap: mm });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/:id/save', auth, async (req, res) => {
  try {
    const mm = await MindMap.findOne({ _id: req.params.id, userId: req.user._id });
    if (!mm) return res.status(404).json({ error: 'Not found' });
    mm.isSaved = !mm.isSaved;
    await mm.save();
    res.json({ mindMap: mm });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const mm = await MindMap.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!mm) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
