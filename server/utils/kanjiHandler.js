const Kanji = require('../models/Kanji');

/**
 * Phân tích chi tiết một chữ Kanji bằng Gemini AI (có lưu Cache vào DB)
 */
async function analyzeKanjiWithAI(kanji) {
  try {
    // 1. Kiểm tra trong Database xem đã có chưa
    const cachedKanji = await Kanji.findOne({ kanji });
    if (cachedKanji) {
      console.log(`♻️ Sử dụng dữ liệu Cache cho chữ: ${kanji}`);
      return cachedKanji;
    }

    // 2. Nếu chưa có, gọi Gemini AI
    console.log(`🤖 Gọi AI phân tích chữ mới: ${kanji}`);
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const prompt = `
      Bạn là một chuyên gia ngôn ngữ tiếng Nhật. 
      Hãy phân tích chi tiết chữ Kanji sau: "${kanji}"
      Trả về kết quả dưới dạng JSON với cấu trúc sau:
      {
        "kanji": "${kanji}",
        "sinoVietnamese": "âm Hán Việt",
        "meaning": "nghĩa tiếng Việt",
        "onyomi": "cách đọc Onyomi",
        "kunyomi": "cách đọc Kunyomi",
        "radical": "bộ thủ",
        "strokes": "số nét",
        "examples": [
          {"word": "từ ví dụ 1", "reading": "cách đọc 1", "meaning": "nghĩa 1"},
          {"word": "từ ví dụ 2", "reading": "cách đọc 2", "meaning": "nghĩa 2"},
          {"word": "từ ví dụ 3", "reading": "cách đọc 3", "meaning": "nghĩa 3"}
        ]
      }
      Chỉ trả về mã JSON, không thêm văn bản giải thích.
    `;

    const payload = {
      contents: [{
        parts: [{ text: prompt }]
      }]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Lỗi Gemini Kanji AI:', data.error);
      throw new Error(data.error?.message || 'Lỗi phân tích Kanji');
    }

    const responseText = data.candidates[0].content.parts[0].text;
    const cleanJson = responseText.replace(/```json|```/g, '').trim();
    const analysisResult = JSON.parse(cleanJson);

    // 3. Lưu vào Database để lần sau dùng lại
    const newKanji = new Kanji(analysisResult);
    await newKanji.save();
    console.log(`✅ Đã lưu Cache cho chữ: ${kanji}`);

    return newKanji;
  } catch (error) {
    console.error('Lỗi trong analyzeKanjiWithAI:', error);
    throw error;
  }
}

module.exports = { analyzeKanjiWithAI };
