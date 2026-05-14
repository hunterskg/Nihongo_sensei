const express = require('express');
const router = express.Router();
const { processTextToFlashcards } = require('../utils/aiHandler');
const { analyzeKanjiWithAI } = require('../utils/kanjiHandler');
const Deck = require('../models/Deck');
const Flashcard = require('../models/Flashcard');
const Kanji = require('../models/Kanji');

// API: Phân tích văn bản bằng AI và chuẩn bị dữ liệu Flashcards
router.post('/analyze-to-cards', async (req, res) => {
  console.log("📥 Đã nhận yêu cầu phân tích AI từ Frontend...");
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Không có văn bản để phân tích.' });

    const flashcards = await processTextToFlashcards(text);
    res.json(flashcards);
  } catch (error) {
    res.status(500).json({ error: 'AI không thể phân tích văn bản này.' });
  }
});

// API: Lưu danh sách Flashcards vào một chủ đề (Deck)
router.post('/save-flashcards', async (req, res) => {
  try {
    const { deckTitle, cards } = req.body;

    // Tìm hoặc tạo mới bộ thẻ
    let deck = await Deck.findOne({ title: deckTitle });
    if (!deck) {
      deck = new Deck({ title: deckTitle });
      await deck.save();
    }

    // Lưu các thẻ
    const savedCards = await Promise.all(cards.map(card => {
      return new Flashcard({ ...card, deckId: deck._id }).save();
    }));

    res.json({ message: 'Đã lưu thành công!', deckId: deck._id, count: savedCards.length });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lưu dữ liệu.' });
  }
});

// API: Lấy danh sách tất cả các bộ thẻ
router.get('/decks', async (req, res) => {
  try {
    const decks = await Deck.find().sort({ createdAt: -1 });
    res.json(decks);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy danh sách bộ thẻ.' });
  }
});

// API: Lấy danh sách thẻ trong một bộ thẻ cụ thể
router.get('/decks/:deckId/cards', async (req, res) => {
  try {
    const cards = await Flashcard.find({ deckId: req.params.deckId });
    res.json(cards);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy danh sách thẻ.' });
  }
});

// API: Xóa một bộ thẻ và tất cả thẻ bên trong nó
router.delete('/decks/:deckId', async (req, res) => {
  try {
    await Flashcard.deleteMany({ deckId: req.params.deckId });
    await Deck.findByIdAndDelete(req.params.deckId);
    res.json({ message: 'Đã xóa bộ thẻ thành công!' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi xóa bộ thẻ.' });
  }
});

// API: Cập nhật một thẻ từ vựng
router.put('/cards/:cardId', async (req, res) => {
  try {
    const updatedCard = await Flashcard.findByIdAndUpdate(req.params.cardId, req.body, { new: true });
    res.json(updatedCard);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi cập nhật thẻ.' });
  }
});

// API: Xóa một thẻ từ vựng
router.delete('/cards/:cardId', async (req, res) => {
  try {
    await Flashcard.findByIdAndDelete(req.params.cardId);
    res.json({ message: 'Đã xóa thẻ thành công!' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi xóa thẻ.' });
  }
});

// API: Thêm một thẻ thủ công vào bộ thẻ
router.post('/decks/:deckId/cards', async (req, res) => {
  try {
    const newCard = new Flashcard({ ...req.body, deckId: req.params.deckId });
    await newCard.save();
    res.json(newCard);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi thêm thẻ mới.' });
  }
});

// API: Phân tích chi tiết một chữ Kanji
router.post('/analyze-kanji', async (req, res) => {
  try {
    const { kanji } = req.body;
    if (!kanji) return res.status(400).json({ error: 'Không có chữ Kanji để phân tích.' });

    const analysis = await analyzeKanjiWithAI(kanji);
    res.json(analysis);
  } catch (error) {
    console.error('Lỗi route analyze-kanji:', error);
    res.status(500).json({ error: 'Không thể phân tích chữ Kanji này.' });
  }
});

// API: Lấy tất cả Kanji đã có trong database
router.get('/kanjis', async (req, res) => {
  try {
    const kanjis = await Kanji.find().sort({ createdAt: -1 });
    res.json(kanjis);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy danh sách Kanji.' });
  }
});

module.exports = router;
