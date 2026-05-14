const mongoose = require('mongoose');

const DeckSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  userId: {
    type: String, // Sau này sẽ dùng ID từ hệ thống Auth
    default: 'guest'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Deck', DeckSchema);
