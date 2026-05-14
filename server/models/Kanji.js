const mongoose = require('mongoose');

const kanjiSchema = new mongoose.Schema({
  kanji: { type: String, required: true, unique: true },
  sinoVietnamese: String,
  meaning: String,
  onyomi: String,
  kunyomi: String,
  radical: String,
  strokes: String,
  examples: [{
    word: String,
    reading: String,
    meaning: String
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Kanji', kanjiSchema);
