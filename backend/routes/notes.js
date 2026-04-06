const express = require('express');
const auth = require('../middleware/auth');
const Note = require('../models/Note');
const Document = require('../models/Document');
const { generateNotes } = require('../utils/aiHelper');

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
    const generated = await generateNotes(sourceText, title || 'Notes');
    const note = await new Note({
      userId: req.user._id,
      documentId: documentId || null,
      title: title || 'Generated Notes',
      content: generated.detailedNotes || generated.summary,
      summary: generated.summary || '',
      keyPoints: generated.keyPoints || [],
      tags: generated.tags || [],
      isSaved: false,
    }).save();
    res.status(201).json({ note });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/', auth, async (req, res) => {
  try {
    const filter = { userId: req.user._id };
    if (req.query.saved === 'true') filter.isSaved = true;
    const notes = await Note.find(filter).populate('documentId', 'originalName').sort({ updatedAt: -1 });
    res.json({ notes });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.user._id }).populate('documentId', 'originalName');
    if (!note) return res.status(404).json({ error: 'Not found' });
    res.json({ note });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/:id/save', auth, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.user._id });
    if (!note) return res.status(404).json({ error: 'Not found' });
    note.isSaved = !note.isSaved;
    await note.save();
    res.json({ note });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!note) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
