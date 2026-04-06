const express = require('express');
const auth = require('../middleware/auth');
const Note = require('../models/Note');
const Quiz = require('../models/Quiz');
const MindMap = require('../models/MindMap');
const Document = require('../models/Document');

const router = express.Router();

router.get('/stats', auth, async (req, res) => {
  try {
    const uid = req.user._id;
    const [totalDocuments, totalNotes, savedNotes, totalQuizzes, savedQuizzes, totalMindMaps, savedMindMaps, quizzes] =
      await Promise.all([
        Document.countDocuments({ userId: uid }),
        Note.countDocuments({ userId: uid }),
        Note.countDocuments({ userId: uid, isSaved: true }),
        Quiz.countDocuments({ userId: uid }),
        Quiz.countDocuments({ userId: uid, isSaved: true }),
        MindMap.countDocuments({ userId: uid }),
        MindMap.countDocuments({ userId: uid, isSaved: true }),
        Quiz.find({ userId: uid }).select('attempts bestScore'),
      ]);
    const quizzesTaken = quizzes.reduce((s, q) => s + q.attempts, 0);
    const bestQuizScore = quizzes.length ? Math.max(...quizzes.map((q) => q.bestScore)) : 0;
    res.json({ totalDocuments, totalNotes, savedNotes, totalQuizzes, savedQuizzes, totalMindMaps, savedMindMaps, quizzesTaken, bestQuizScore });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/recent', auth, async (req, res) => {
  try {
    const uid = req.user._id;
    const [notes, quizzes, maps, docs] = await Promise.all([
      Note.find({ userId: uid }).sort({ createdAt: -1 }).limit(5).select('title createdAt isSaved'),
      Quiz.find({ userId: uid }).sort({ createdAt: -1 }).limit(5).select('title createdAt isSaved'),
      MindMap.find({ userId: uid }).sort({ createdAt: -1 }).limit(5).select('title createdAt isSaved'),
      Document.find({ userId: uid }).sort({ uploadedAt: -1 }).limit(5).select('originalName uploadedAt'),
    ]);
    const activity = [
      ...notes.map((n) => ({ _id: n._id, type: 'note', title: n.title, createdAt: n.createdAt, isSaved: n.isSaved })),
      ...quizzes.map((q) => ({ _id: q._id, type: 'quiz', title: q.title, createdAt: q.createdAt, isSaved: q.isSaved })),
      ...maps.map((m) => ({ _id: m._id, type: 'mindmap', title: m.title, createdAt: m.createdAt, isSaved: m.isSaved })),
      ...docs.map((d) => ({ _id: d._id, type: 'document', title: d.originalName, createdAt: d.uploadedAt, isSaved: null })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10);
    res.json({ activity });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
