const express = require('express');
const auth = require('../middleware/auth');
const Quiz = require('../models/Quiz');
const Document = require('../models/Document');
const { generateQuiz } = require('../utils/aiHelper');

const router = express.Router();

router.post('/generate', auth, async (req, res) => {
  try {
    const { documentId, text, title, numQuestions } = req.body;
    let sourceText = text || '';
    if (documentId) {
      const doc = await Document.findOne({ _id: documentId, userId: req.user._id });
      if (!doc) return res.status(404).json({ error: 'Document not found' });
      sourceText = doc.extractedText;
    }
    if (sourceText.trim().length < 50) return res.status(400).json({ error: 'Not enough text (min 50 chars)' });
    const num = Math.min(Math.max(parseInt(numQuestions) || 10, 3), 20);
    const generated = await generateQuiz(sourceText, num);
    if (!generated.questions?.length) return res.status(500).json({ error: 'Failed to generate quiz. Try again.' });
    const quiz = await new Quiz({
      userId: req.user._id,
      documentId: documentId || null,
      title: title || 'Generated Quiz',
      questions: generated.questions,
      isSaved: false,
    }).save();
    res.status(201).json({ quiz });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/', auth, async (req, res) => {
  try {
    const filter = { userId: req.user._id };
    if (req.query.saved === 'true') filter.isSaved = true;
    const quizzes = await Quiz.find(filter).populate('documentId', 'originalName').sort({ updatedAt: -1 });
    res.json({ quizzes });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, userId: req.user._id }).populate('documentId', 'originalName');
    if (!quiz) return res.status(404).json({ error: 'Not found' });
    res.json({ quiz });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/:id/save', auth, async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, userId: req.user._id });
    if (!quiz) return res.status(404).json({ error: 'Not found' });
    quiz.isSaved = !quiz.isSaved;
    await quiz.save();
    res.json({ quiz });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/attempt', auth, async (req, res) => {
  try {
    const { score } = req.body;
    const quiz = await Quiz.findOne({ _id: req.params.id, userId: req.user._id });
    if (!quiz) return res.status(404).json({ error: 'Not found' });
    quiz.attempts += 1;
    if (score > quiz.bestScore) quiz.bestScore = score;
    await quiz.save();
    res.json({ quiz });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const quiz = await Quiz.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!quiz) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
