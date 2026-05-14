const dotenv = require('dotenv');

dotenv.config();

/**
 * Phân tích văn bản thô từ OCR thành danh sách Flashcards
 * Gọi trực tiếp API của Google không qua thư viện SDK để tránh lỗi 404
 */
async function processTextToFlashcards(text) {
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const prompt = `
    Bạn là một trợ lý học tiếng Nhật chuyên nghiệp. 
    Dưới đây là văn bản trích xuất từ hình ảnh (có thể có lỗi OCR):
    ---
    ${text}
    ---
    Hãy lọc ra các từ vựng tiếng Nhật, cách đọc (Furigana) và nghĩa tiếng Việt của chúng. 
    QUY TẮC QUAN TRỌNG: 
    1. Các từ nằm trong dấu sao đôi ** (ví dụ: **そっくり**) CHẮC CHẮN là từ vựng chính cần tạo thẻ.
    2. Đối với từ Hiragana/Katakana không có Kanji, hãy để trống trường "furigana" hoặc lặp lại từ đó vào "furigana".
    3. Phân tích ngữ cảnh để ghép đúng từ vựng (trong dấu **) với nghĩa tiếng Việt tương ứng.
    4. Nếu một dòng có nhiều từ trong dấu **, hãy tách chúng thành các thẻ riêng biệt.
    Trả về kết quả dưới dạng mảng JSON các đối tượng có cấu trúc:
    [
      {"kanji": "...", "furigana": "...", "meaning": "...", "example": "..."}
    ]
    Chỉ trả về mã JSON, không thêm văn bản khác.
  `;

  const payload = {
    contents: [{
      parts: [{ text: prompt }]
    }]
  };

  try {
    console.log("Calling Gemini API URL:", url);
    console.log("Payload:", JSON.stringify(payload, null, 2));

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Lỗi Gemini AI:', data.error);
      throw new Error(data.error?.message || 'Lỗi Gemini AI');
    }

    const responseText = data.candidates[0].content.parts[0].text;

    console.log("--- PHẢN HỒI THÔ TỪ AI ---");
    console.log(responseText);
    console.log("--------------------------");

    const cleanJson = responseText.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("❌ LỖI AI HANDLER:", error.message);
    throw error;
  }
}

module.exports = { processTextToFlashcards };
