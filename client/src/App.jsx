import React, { useState, useEffect } from 'react';
import { Upload, Image as ImageIcon, Zap, ShieldCheck, Loader2, BrainCircuit, Save, Library, Home, ChevronRight, ChevronLeft, BookOpen, Trash2, Edit2, Check, X, PlusCircle, Play, RotateCw, Languages } from 'lucide-react';
import axios from 'axios';
import './App.css';

function App() {
  const [view, setView] = useState('home');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [ocrMode, setOcrMode] = useState('free');
  const [loading, setLoading] = useState(false);
  const [resultText, setResultText] = useState('');
  
  const [aiLoading, setAiLoading] = useState(false);
  const [flashcards, setFlashcards] = useState([]);
  const [deckTitle, setDeckTitle] = useState('');
  const [selectedExistingDeck, setSelectedExistingDeck] = useState('');

  const [decks, setDecks] = useState([]);
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [deckCards, setDeckCards] = useState([]);
  const [editingCard, setEditingCard] = useState(null);

  // Study Mode States
  const [isStudyMode, setIsStudyMode] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Quiz Mode States
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showQuizResult, setShowQuizResult] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showQuizTypeSelect, setShowQuizTypeSelect] = useState(false);
  const [currentQuizLabel, setCurrentQuizLabel] = useState("");

  // Kanji Analysis States
  const [kanjiAnalysis, setKanjiAnalysis] = useState(null);
  const [isKanjiLoading, setIsKanjiLoading] = useState(false);

  // Notification State
  const [toast, setToast] = useState(null);

  // Kanji Dictionary States
  const [allKanjis, setAllKanjis] = useState([]);

  useEffect(() => {
    fetchDecks();
    if (view === 'kanjis') fetchKanjis();
  }, [view]);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchDecks = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/learning/decks');
      setDecks(response.data);
    } catch (error) {
      showToast("Lỗi lấy danh sách bộ thẻ", "error");
    }
  };

  const fetchDeckDetails = async (deck) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/learning/decks/${deck._id}/cards`);
      setSelectedDeck(deck);
      setDeckCards(response.data);
      setIsStudyMode(false);
    } catch (error) {
      showToast("Lỗi lấy chi tiết thẻ", "error");
    }
  };

  const fetchKanjis = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/learning/kanjis');
      setAllKanjis(response.data);
    } catch (error) {
      showToast("Lỗi lấy danh sách Kanji", "error");
    }
  };

  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) setSelectedFile(e.dataTransfer.files[0]);
  };

  const handleDeleteDeck = async (e, deckId) => {
    e.stopPropagation();
    if (!window.confirm("Bạn có chắc chắn muốn xóa bộ thẻ này?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/learning/decks/${deckId}`);
      fetchDecks();
      showToast("Đã xóa bộ thẻ", "success");
    } catch (error) {
      showToast("Lỗi khi xóa bộ thẻ", "error");
    }
  };

  const handleDeleteCard = async (cardId) => {
    if (!window.confirm("Xóa thẻ này?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/learning/cards/${cardId}`);
      setDeckCards(deckCards.filter(c => c._id !== cardId));
      showToast("Đã xóa thẻ", "success");
    } catch (error) {
      showToast("Lỗi khi xóa thẻ", "error");
    }
  };

  const handleUpdateCard = async (card) => {
    try {
      await axios.put(`http://localhost:5000/api/learning/cards/${card._id}`, card);
      setEditingCard(null);
      fetchDeckDetails(selectedDeck);
      showToast("Đã cập nhật", "success");
    } catch (error) {
      showToast("Lỗi khi cập nhật", "error");
    }
  };

  const handleAddManualCard = async () => {
    const newCardData = { kanji: "Từ mới", furigana: "", meaning: "Nghĩa của từ", example: "" };
    try {
      const response = await axios.post(`http://localhost:5000/api/learning/decks/${selectedDeck._id}/cards`, newCardData);
      setDeckCards([...deckCards, response.data]);
      setEditingCard(response.data._id);
      showToast("Đã thêm từ mới", "success");
    } catch (error) {
      showToast("Lỗi khi thêm thẻ", "error");
    }
  };

  const handleExtract = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setResultText('');
    setFlashcards([]);
    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('mode', ocrMode);

    try {
      const response = await axios.post('http://localhost:5000/api/ocr/extract', formData);
      setResultText(response.data.text);
      showToast("Trích xuất thành công", "success");
    } catch (error) {
      showToast('Lỗi khi xử lý ảnh.', "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAiAnalyze = async () => {
    if (!resultText) return;
    setAiLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/learning/analyze-to-cards', { text: resultText });
      setFlashcards(response.data);
      showToast("Đã tạo Flashcards", "success");
      setTimeout(() => { window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); }, 100);
    } catch (error) {
      showToast('AI không thể phân tích văn bản này.', "error");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveDeck = async () => {
    if (flashcards.length === 0) return;
    const finalTitle = selectedExistingDeck || deckTitle || "Chủ đề không tên";
    try {
      await axios.post('http://localhost:5000/api/learning/save-flashcards', {
        deckTitle: finalTitle,
        cards: flashcards
      });
      showToast('Đã lưu thành công!', "success");
      setFlashcards([]);
      setResultText('');
      setSelectedFile(null);
      setDeckTitle('');
      setSelectedExistingDeck('');
      setView('library');
    } catch (error) {
      showToast('Lỗi khi lưu.', "error");
    }
  };

  const startStudy = () => {
    if (deckCards.length === 0) return showToast("Bộ thẻ này chưa có từ vựng!", "info");
    setIsStudyMode(true);
    setCurrentCardIndex(0);
    setIsFlipped(false);
  };

  const nextCard = () => {
    if (currentCardIndex < deckCards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
    } else {
      showToast("Chúc mừng! Bạn đã hoàn thành bộ thẻ này.", "success");
      setIsStudyMode(false);
    }
  };

  const prevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setIsFlipped(false);
    }
  };

  // Quiz Mode Logic
  const startQuiz = (type) => {
    if (deckCards.length < 2) return showToast("Cần ít nhất 2 thẻ để bắt đầu trắc nghiệm!", "info");
    
    const types = ['kanji-meaning', 'kanji-furigana', 'furigana-kanji', 'meaning-kanji'];
    
    const questions = deckCards.map(card => {
      const currentType = type === 'random' ? types[Math.floor(Math.random() * types.length)] : type;
      let questionText = "";
      let questionHint = "";
      let correctAnswer = "";
      let optionsField = "";
      let label = "";

      switch(currentType) {
        case 'kanji-meaning':
          questionText = card.kanji || card.furigana;
          questionHint = card.kanji ? card.furigana : '';
          correctAnswer = card.meaning;
          optionsField = 'meaning';
          label = "Chọn nghĩa đúng của từ:";
          break;
        case 'kanji-furigana':
          questionText = card.kanji || card.furigana;
          questionHint = "";
          correctAnswer = card.furigana;
          optionsField = 'furigana';
          label = "Chọn cách đọc (Hiragana) đúng:";
          break;
        case 'furigana-kanji':
          questionText = card.furigana;
          questionHint = "";
          correctAnswer = card.kanji || card.furigana;
          optionsField = 'kanji';
          label = "Chọn Kanji tương ứng:";
          break;
        case 'meaning-kanji':
          questionText = card.meaning;
          questionHint = "";
          correctAnswer = card.kanji || card.furigana;
          optionsField = 'kanji';
          label = "Chọn Kanji cho nghĩa này:";
          break;
      }

      // Chọn distractors
      const distractors = deckCards
        .filter(c => c._id !== card._id)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
        .map(c => {
          if (optionsField === 'kanji') return c.kanji || c.furigana;
          return c[optionsField];
        });
      
      const options = [...distractors, correctAnswer].sort(() => 0.5 - Math.random());
      
      return {
        id: card._id,
        questionText,
        questionHint,
        correctAnswer,
        options,
        label,
        // Lưu thông tin gốc để giải thích
        originalCard: {
          kanji: card.kanji,
          furigana: card.furigana,
          meaning: card.meaning,
          example: card.example
        }
      };
    }).sort(() => 0.5 - Math.random());

    setQuizQuestions(questions);
    setCurrentQuizIndex(0);
    setScore(0);
    setIsQuizMode(true);
    setShowQuizResult(false);
    setIsAnswered(false);
    setSelectedAnswer(null);
    setShowQuizTypeSelect(false);
  };

  const handleKanjiClick = async (e, char) => {
    e.stopPropagation();
    if (!char || !/[\u4e00-\u9faf]/.test(char)) return;

    setIsKanjiLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/learning/analyze-kanji', { kanji: char });
      setKanjiAnalysis(response.data);
    } catch (error) {
      console.error("Lỗi phân tích Kanji");
    } finally {
      setIsKanjiLoading(false);
    }
  };

  const renderKanjiText = (text) => {
    if (!text) return null;
    return text.split('').map((char, index) => {
      const isKanji = /[\u4e00-\u9faf]/.test(char);
      return (
        <span 
          key={index} 
          className={isKanji ? "kanji-clickable" : ""} 
          onClick={(e) => isKanji && handleKanjiClick(e, char)}
        >
          {char}
        </span>
      );
    });
  };

  const handleAnswer = (option) => {
    if (isAnswered) return;
    const currentQuestion = quizQuestions[currentQuizIndex];
    setSelectedAnswer(option);
    setIsAnswered(true);
    
    if (option === currentQuestion.correctAnswer) {
      // Chỉ cộng điểm nếu trả lời đúng ngay lần đầu
      if (!currentQuestion.isRetry) {
        setScore(score + 1);
      }
    } else {
      // Nếu sai, thêm lại câu này vào cuối danh sách để làm lại sau
      const retryQuestion = { ...currentQuestion, isRetry: true };
      setQuizQuestions([...quizQuestions, retryQuestion]);
      showToast("Câu này sẽ xuất hiện lại để bạn ôn tập!", "info");
    }
  };

  const goToNextQuestion = () => {
    if (currentQuizIndex < quizQuestions.length - 1) {
      setCurrentQuizIndex(currentQuizIndex + 1);
      setIsAnswered(false);
      setSelectedAnswer(null);
    } else {
      setShowQuizResult(true);
    }
  };

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="nav-logo" onClick={() => {setView('home'); setSelectedDeck(null); setIsStudyMode(false); setIsQuizMode(false);}}>
          にほんご <span style={{color: '#bc002d'}}>Sensei</span>
        </div>
        <div className="nav-links">
          <button className={`nav-item ${view === 'home' ? 'active' : ''}`} onClick={() => {setView('home'); setSelectedDeck(null); setIsStudyMode(false); setIsQuizMode(false);}}>
            <Home size={20} /> Quét ảnh
          </button>
          <button className={`nav-item ${view === 'library' ? 'active' : ''}`} onClick={() => {setView('library'); setSelectedDeck(null);}}>
            <Library size={20} /> Bộ sưu tập
          </button>
          <button className={`nav-item ${view === 'kanjis' ? 'active' : ''}`} onClick={() => setView('kanjis')}>
            <Languages size={20} /> Từ điển Kanji
          </button>
        </div>
      </nav>

      {view === 'home' ? (
        <div className="glass-card animate-fade-in">
          <header>
            <h1>Trình quét học tập AI</h1>
            <p>Biến mọi trang sách thành bộ thẻ học thông minh</p>
          </header>

          <div className="mode-selector">
            <button className={`btn-mode ${ocrMode === 'free' ? 'active' : ''}`} onClick={() => setOcrMode('free')}>
              <Zap size={18} /> Tiết kiệm
            </button>
            <button className={`btn-mode ${ocrMode === 'premium' ? 'active' : ''}`} onClick={() => setOcrMode('premium')}>
              <ShieldCheck size={18} /> Cao cấp
            </button>
          </div>

          <div className={`uploader-area ${dragActive ? 'active' : ''}`} onDragOver={handleDrag} onDrop={handleDrop} onClick={() => document.getElementById('file-input').click()}>
            <input id="file-input" type="file" style={{display: 'none'}} onChange={(e) => setSelectedFile(e.target.files[0])} accept="image/*" />
            <div className="icon-box">
              {loading ? <Loader2 size={64} className="animate-spin" /> : (selectedFile ? <ImageIcon size={64} /> : <Upload size={64} />)}
            </div>
            <h3>{loading ? "Đang xử lý..." : (selectedFile ? selectedFile.name : "Kéo thả ảnh vào đây")}</h3>
            {selectedFile && !loading && <button className="primary-btn" onClick={(e) => {e.stopPropagation(); handleExtract();}}>Bắt đầu trích xuất</button>}
          </div>

          {resultText && (
            <div className="result-section animate-fade-in" style={{marginTop: '30px'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
                <h4>Văn bản đã nhận diện:</h4>
                <button className="ai-btn" onClick={handleAiAnalyze} disabled={aiLoading}>
                  {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <BrainCircuit size={16} />}
                  {aiLoading ? ' Đang xử lý...' : ' Dùng AI tạo Flashcards'}
                </button>
              </div>
              <textarea value={resultText} onChange={(e) => setResultText(e.target.value)} />
            </div>
          )}

          {flashcards.length > 0 && (
            <div className="flashcards-preview animate-fade-in">
              <div className="save-controls">
                <div style={{flex: 1}}>
                  <select className="deck-select" value={selectedExistingDeck} onChange={(e) => {setSelectedExistingDeck(e.target.value); setDeckTitle('');}}>
                    <option value="">-- Tạo bộ thẻ mới --</option>
                    {decks.map(d => <option key={d._id} value={d.title}>{d.title}</option>)}
                  </select>
                </div>
                {!selectedExistingDeck && (
                  <div style={{flex: 1}}>
                    <input className="deck-input" value={deckTitle} onChange={(e) => setDeckTitle(e.target.value)} placeholder="Tên chủ đề mới..." />
                  </div>
                )}
                <button className="save-btn" onClick={handleSaveDeck}><Save size={18} /> Lưu</button>
              </div>
              <div className="cards-grid">
                {flashcards.map((card, index) => (
                  <div key={index} className="preview-card">
                    <div className="kanji">{renderKanjiText(card.kanji || card.furigana)}</div>
                    <div className="furigana">{card.kanji ? card.furigana : ''}</div>
                    <div className="meaning">{card.meaning}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : view === 'kanjis' ? (
        <div className="kanji-library-view animate-fade-in">
          <header style={{marginBottom: '30px'}}>
            <h2>Từ điển Kanji cá nhân</h2>
            <p>Tất cả các chữ Hán bạn đã từng phân tích sẽ được lưu tại đây</p>
          </header>
          
          <div className="kanjis-grid">
            {allKanjis.map((kj) => (
              <div key={kj._id} className="kanji-card" onClick={(e) => handleKanjiClick(e, kj.kanji)}>
                <div className="kj-char">{kj.kanji}</div>
                <div className="kj-sino">{kj.sinoVietnamese}</div>
                <div className="kj-meaning">{kj.meaning}</div>
              </div>
            ))}
          </div>
          
          {allKanjis.length === 0 && (
            <div className="empty-state">
              <Languages size={48} />
              <p>Bạn chưa phân tích chữ Kanji nào. Hãy bắt đầu học để làm giàu từ điển nhé!</p>
            </div>
          )}
        </div>
      ) : (
        <div className="library-view animate-fade-in">
          {!selectedDeck ? (
            <>
              <h2 style={{marginBottom: '25px'}}>Bộ sưu tập của bạn</h2>
              <div className="decks-grid">
                {decks.map(deck => (
                  <div key={deck._id} className="deck-card" onClick={() => fetchDeckDetails(deck)}>
                    <div className="deck-icon"><BookOpen size={32} /></div>
                    <div className="deck-info">
                      <h3>{deck.title}</h3>
                      <p>{new Date(deck.createdAt).toLocaleDateString('vi-VN')}</p>
                    </div>
                    <div className="deck-actions">
                      <button className="action-btn delete" onClick={(e) => handleDeleteDeck(e, deck._id)}><Trash2 size={18} /></button>
                      <ChevronRight className="chevron" />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            isStudyMode ? (
              <div className="study-container animate-fade-in">
                <div className="study-header">
                  <button className="back-btn" onClick={() => setIsStudyMode(false)}>← Kết thúc học</button>
                  <div className="progress">{currentCardIndex + 1} / {deckCards.length}</div>
                </div>
                
                <div className={`flip-card ${isFlipped ? 'flipped' : ''}`} onClick={() => setIsFlipped(!isFlipped)}>
                  <div className="flip-card-inner">
                    <div className="flip-card-front">
                      <div className="kanji-large">{renderKanjiText(deckCards[currentCardIndex].kanji || deckCards[currentCardIndex].furigana)}</div>
                      <div className="furigana-large">{deckCards[currentCardIndex].kanji ? deckCards[currentCardIndex].furigana : ''}</div>
                      <div className="hint"><RotateCw size={16} /> Nhấn để lật</div>
                    </div>
                    <div className="flip-card-back">
                      <div className="meaning-large">{deckCards[currentCardIndex].meaning}</div>
                      {deckCards[currentCardIndex].example && <div className="example-large">{deckCards[currentCardIndex].example}</div>}
                    </div>
                  </div>
                </div>

                <div className="study-controls">
                  <button className="prev-btn" onClick={prevCard} disabled={currentCardIndex === 0}>
                    <ChevronLeft size={20} /> Quay lại
                  </button>
                  <button className="next-btn" onClick={nextCard}>
                    Tiếp theo <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            ) : isQuizMode ? (
              <div className="quiz-container animate-fade-in">
                {showQuizTypeSelect ? (
                  <div className="quiz-type-selection animate-fade-in">
                    <div className="quiz-header">
                      <button className="back-btn" onClick={() => {setIsQuizMode(false); setShowQuizTypeSelect(false);}}>← Quay lại</button>
                      <h3 style={{margin: 0}}>Chọn chế độ kiểm tra</h3>
                    </div>
                    <div className="quiz-type-container">
                      <button className="type-btn" onClick={() => startQuiz('kanji-meaning')}>
                        <div className="type-icon"><BookOpen size={24} /></div>
                        <div className="type-info">
                          <h4>Kiểm tra nghĩa (Việt)</h4>
                          <p>Hỏi Kanji/Hiragana, chọn nghĩa tiếng Việt</p>
                        </div>
                      </button>
                      <button className="type-btn" onClick={() => startQuiz('kanji-furigana')}>
                        <div className="type-icon"><RotateCw size={24} /></div>
                        <div className="type-info">
                          <h4>Kiểm tra Hiragana</h4>
                          <p>Hỏi Kanji, chọn cách đọc Hiragana đúng</p>
                        </div>
                      </button>
                      <button className="type-btn" onClick={() => startQuiz('furigana-kanji')}>
                        <div className="type-icon"><ImageIcon size={24} /></div>
                        <div className="type-info">
                          <h4>Hiragana sang Kanji</h4>
                          <p>Hỏi Hiragana, chọn mặt chữ Kanji chính xác</p>
                        </div>
                      </button>
                      <button className="type-btn" onClick={() => startQuiz('meaning-kanji')}>
                        <div className="type-icon"><ShieldCheck size={24} /></div>
                        <div className="type-info">
                          <h4>Nghĩa sang Kanji</h4>
                          <p>Hỏi nghĩa tiếng Việt, chọn Kanji tương ứng</p>
                        </div>
                      </button>
                      <button className="type-btn" style={{borderColor: '#6c5ce7'}} onClick={() => startQuiz('random')}>
                        <div className="type-icon" style={{backgroundColor: '#efedff', color: '#6c5ce7'}}><Zap size={24} /></div>
                        <div className="type-info">
                          <h4>Chế độ ngẫu nhiên</h4>
                          <p>Trộn lẫn tất cả các kiểu câu hỏi trên</p>
                        </div>
                      </button>
                    </div>
                  </div>
                ) : !showQuizResult ? (
                  <>
                    <div className="quiz-header">
                      <button className="back-btn" onClick={() => setIsQuizMode(false)}>← Thoát</button>
                      <div className="progress">Câu {currentQuizIndex + 1} / {quizQuestions.length}</div>
                    </div>

                    <div className="progress-bar-container">
                      <div className="progress-bar-fill" style={{width: `${((currentQuizIndex) / quizQuestions.length) * 100}%`}}></div>
                    </div>

                    <div className="question-card">
                      <div className="question-label">{quizQuestions[currentQuizIndex].label}</div>
                      <div className="question-text">{quizQuestions[currentQuizIndex].questionText}</div>
                      <div className="question-hint">{quizQuestions[currentQuizIndex].questionHint}</div>
                    </div>

                    <div className="options-grid">
                      {quizQuestions[currentQuizIndex].options.map((option, idx) => (
                        <button 
                          key={idx} 
                          className={`option-btn ${isAnswered ? (option === quizQuestions[currentQuizIndex].correctAnswer ? 'correct' : (option === selectedAnswer ? 'wrong' : '')) : ''}`}
                          onClick={() => handleAnswer(option)}
                          disabled={isAnswered}
                        >
                          {option}
                        </button>
                      ))}
                    </div>

                    {isAnswered && (
                      <div className="explanation-section animate-fade-in">
                        <div className="explanation-box">
                          <div className="explanation-title">
                            {selectedAnswer === quizQuestions[currentQuizIndex].correctAnswer ? <Check size={20} color="#27ae60" /> : <X size={20} color="#d63031" />}
                            {selectedAnswer === quizQuestions[currentQuizIndex].correctAnswer ? "Chính xác!" : "Chưa đúng rồi!"}
                          </div>
                          <div className="explanation-content">
                            <div className="explanation-item"><strong>Đáp án đúng:</strong> {quizQuestions[currentQuizIndex].correctAnswer}</div>
                            <div className="explanation-item"><strong>Chi tiết:</strong> {quizQuestions[currentQuizIndex].originalCard.kanji} ({quizQuestions[currentQuizIndex].originalCard.furigana}) - {quizQuestions[currentQuizIndex].originalCard.meaning}</div>
                            {quizQuestions[currentQuizIndex].originalCard.example && (
                              <div className="explanation-example">
                                <strong>Ví dụ:</strong> {quizQuestions[currentQuizIndex].originalCard.example}
                              </div>
                            )}
                          </div>
                        </div>
                        <button className="quiz-next-btn" onClick={goToNextQuestion}>
                          Câu tiếp theo <ChevronRight size={20} />
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="result-screen animate-fade-in">
                    <div className="score-circle">
                      <div className="score-value">{score}</div>
                      <div className="score-label">/{deckCards.length}</div>
                    </div>
                    <div className="result-message">
                      {score === deckCards.length ? "Tuyệt vời! Hoàn hảo! 🎉" : score > deckCards.length / 2 ? "Làm tốt lắm! 👍" : "Cố gắng lên nhé! 💪"}
                    </div>
                    <p className="result-sub">Bạn đã hoàn thành bài trắc nghiệm bộ thẻ "{selectedDeck.title}"</p>
                    <button className="next-btn" onClick={() => setIsQuizMode(false)}>Quay lại bộ sưu tập</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="deck-details animate-fade-in">
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <button className="back-btn" onClick={() => setSelectedDeck(null)}>← Quay lại</button>
                  <div style={{display: 'flex', gap: '10px'}}>
                    <button className="study-btn" onClick={startStudy}><Play size={18} /> Học thẻ</button>
                    <button className="study-btn" style={{backgroundColor: '#e17055'}} onClick={() => {setIsQuizMode(true); setShowQuizTypeSelect(true);}}><Zap size={18} /> Trắc nghiệm</button>
                    <button className="add-card-btn" onClick={handleAddManualCard}><PlusCircle size={18} /> Thêm từ</button>
                  </div>
                </div>
                <h2 style={{margin: '20px 0'}}>{selectedDeck.title}</h2>
                <div className="cards-grid">
                  {deckCards.map(card => (
                    <div key={card._id} className="preview-card edit-container">
                      {editingCard === card._id ? (
                        <div className="edit-form">
                          <input value={card.kanji} onChange={(e) => setDeckCards(deckCards.map(c => c._id === card._id ? {...c, kanji: e.target.value} : c))} />
                          <input value={card.furigana} onChange={(e) => setDeckCards(deckCards.map(c => c._id === card._id ? {...c, furigana: e.target.value} : c))} />
                          <input value={card.meaning} onChange={(e) => setDeckCards(deckCards.map(c => c._id === card._id ? {...c, meaning: e.target.value} : c))} />
                          <div className="edit-actions">
                            <button className="confirm-btn" onClick={() => handleUpdateCard(card)}><Check size={16} /></button>
                            <button className="cancel-btn" onClick={() => setEditingCard(null)}><X size={16} /></button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="card-actions-overlay">
                            <button onClick={() => setEditingCard(card._id)}><Edit2 size={16} /></button>
                            <button onClick={() => handleDeleteCard(card._id)}><Trash2 size={16} /></button>
                          </div>
                          <div className="kanji">{renderKanjiText(card.kanji || card.furigana)}</div>
                          <div className="furigana">{card.kanji ? card.furigana : ''}</div>
                          <div className="meaning">{card.meaning}</div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )

          )}
        </div>
      )}

      <footer style={{marginTop: '60px', textAlign: 'center', color: '#b2bec3', fontSize: '0.9rem'}}>
        &copy; 2026 Japan Learning AI • Nihongo Sensei v1.0
      </footer>

      {isKanjiLoading && (
        <div className="kanji-loading-overlay">
          <div className="kanji-loader">
            <Loader2 size={40} className="animate-spin" />
            <p>Đang phân tích Kanji...</p>
          </div>
        </div>
      )}

      {kanjiAnalysis && (
        <div className="kanji-modal-overlay" onClick={() => setKanjiAnalysis(null)}>
          <div className="kanji-modal animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="kanji-modal-header">
              <h2>Phân tích chữ Hán</h2>
              <button className="close-btn" onClick={() => setKanjiAnalysis(null)}><X size={24} /></button>
            </div>
            <div className="kanji-modal-content">
              <div className="kanji-main-section">
                <div className="kanji-big">{kanjiAnalysis.kanji}</div>
                <div className="kanji-basic-info">
                  <div className="info-item"><strong>Âm Hán Việt:</strong> <span className="sino-viet">{kanjiAnalysis.sinoVietnamese}</span></div>
                  <div className="info-item"><strong>Nghĩa:</strong> {kanjiAnalysis.meaning}</div>
                  <div className="info-item"><strong>Bộ thủ:</strong> {kanjiAnalysis.radical}</div>
                  <div className="info-item"><strong>Số nét:</strong> {kanjiAnalysis.strokes}</div>
                </div>
              </div>
              
              <div className="kanji-readings">
                <div className="reading-block">
                  <span className="label">Onyomi:</span>
                  <span className="value">{kanjiAnalysis.onyomi}</span>
                </div>
                <div className="reading-block">
                  <span className="label">Kunyomi:</span>
                  <span className="value">{kanjiAnalysis.kunyomi}</span>
                </div>
              </div>

              <div className="kanji-examples">
                <h4>Ví dụ sử dụng:</h4>
                <div className="example-list">
                  {kanjiAnalysis.examples.map((ex, idx) => (
                    <div key={idx} className="example-item">
                      <div className="ex-word">{ex.word} ({ex.reading})</div>
                      <div className="ex-meaning">{ex.meaning}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast-container ${toast.type} animate-slide-up`}>
          <div className="toast-icon">
            {toast.type === 'success' ? <Check size={18} /> : toast.type === 'error' ? <X size={18} /> : <Zap size={18} />}
          </div>
          <div className="toast-message">{toast.message}</div>
        </div>
      )}
    </div>
  );
}

export default App;
