const express = require('express');
const router = express.Router();
const multer = require('multer');
const Tesseract = require('tesseract.js');
const path = require('path');
const fs = require('fs');

// Cấu hình lưu trữ ảnh tạm thời
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// API nhận diện văn bản (OCR)
router.post('/extract', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Vui lòng tải lên một hình ảnh.' });
    }

    const { mode } = req.body; // 'free' hoặc 'premium'
    const imagePath = req.file.path;

    console.log(`Đang xử lý ảnh: ${imagePath} với chế độ: ${mode}`);

    if (mode === 'premium') {
      const apiKey = process.env.GEMINI_API_KEY;
      const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

      // Đọc ảnh và chuyển sang Base64
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');

      const payload = {
        contents: [{
          parts: [
            { text: "Hãy trích xuất toàn bộ văn bản trong ảnh. QUAN TRỌNG: Hãy sử dụng dấu sao đôi ** bao quanh tất cả các từ được in đậm trong ảnh, hoặc chữ kanji, các từ hiragana không được in đậm thì không cần lọc (ví dụ: **そっくり**, **双子**). Giữ nguyên xuống dòng và bố cục tương đối để dễ dàng phân tích nghĩa." },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: base64Image
              }
            }
          ]
        }]
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      fs.unlinkSync(imagePath); // Xóa ảnh tạm

      if (!response.ok) {
        console.error('Lỗi Gemini Vision:', data.error);
        throw new Error(data.error?.message || 'Lỗi Gemini Vision');
      }

      const extractedText = data.candidates[0].content.parts[0].text;
      return res.json({ text: extractedText, isPremium: true });
    }

    // Chế độ miễn phí dùng Tesseract.js (Hỗ trợ Nhật + Việt)
    const result = await Tesseract.recognize(
      imagePath,
      'jpn+vie',
      { logger: m => console.log(m) }
    );

    // Xóa ảnh sau khi xử lý xong để tiết kiệm bộ nhớ
    fs.unlinkSync(imagePath);

    res.json({
      text: result.data.text,
      confidence: result.data.confidence,
      mode: 'free'
    });

  } catch (error) {
    console.error('Lỗi OCR:', error);
    res.status(500).json({ error: 'Đã xảy ra lỗi khi xử lý hình ảnh.' });
  }
});

module.exports = router;
