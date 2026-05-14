const mongoose = require('mongoose');

const FlashcardSchema = new mongoose.Schema({
  deckId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deck',
    required: true
  },
  kanji: String,
  furigana: String,
  meaning: String,
  example: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Flashcard', FlashcardSchema);
