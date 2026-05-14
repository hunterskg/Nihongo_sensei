const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Kết nối MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Đã kết nối MongoDB thành công'))
  .catch((err) => console.error('❌ Lỗi kết nối MongoDB:', err));

// Routes
const ocrRoutes = require('./routes/ocr');
const learningRoutes = require('./routes/learning');

app.use('/api/ocr', ocrRoutes);
app.use('/api/learning', learningRoutes);

// Routes cơ bản
app.get('/', (req, res) => {
  res.send('Chào mừng bạn đến với Japan Learning API (MongoDB version)!');
});

// Lắng nghe cổng
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});
