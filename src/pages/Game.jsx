import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchQuestions } from '../api/googleService';
import StageMaster from '../components/StageMaster';

function Game() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  const hasFetched = useRef(false); // 避免 React StrictMode 連續抓兩次題目
  
  // 新增：紀錄答題狀態以實現過場延遲
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrectFeedback, setIsCorrectFeedback] = useState(null);

  const playerId = localStorage.getItem('pixel_game_id');

  useEffect(() => {
    if (!playerId) {
      navigate('/');
      return;
    }

    const loadQuestions = async () => {
      if (hasFetched.current) return;
      hasFetched.current = true;
      
      setLoading(true);
      const data = await fetchQuestions();
      setQuestions(data);
      setLoading(false);
    };

    loadQuestions();
  }, [playerId, navigate]);

  const handleAnswer = (option) => {
    if (selectedAnswer !== null) return; // 避免連續點擊

    const currentQ = questions[currentIndex];
    const isCorrect = currentQ.answer === option;
    
    setSelectedAnswer(option);
    setIsCorrectFeedback(isCorrect);

    if (isCorrect) {
      setScore(s => s + 1);
    }
    
    // 延遲 1.2 秒後切換題目
    setTimeout(() => {
      setSelectedAnswer(null);
      setIsCorrectFeedback(null);
      
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex(currentIndex + 1);
      } else {
        // game over
        const finalScore = score + (isCorrect ? 1 : 0);
        navigate('/result', {
          state: {
            score: finalScore,
            total: questions.length
          }
        });
      }
    }, 1200);
  };

  if (loading) {
    return (
      <div className="pixel-container">
        <h2>LOADING...</h2>
        <p className="pixel-text-small">WAITING FOR CHALLENGES</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="pixel-container">
        <h2>ERROR</h2>
        <p>NO QUESTIONS FOUND</p>
        <button className="pixel-btn" onClick={() => navigate('/')}>BACK</button>
      </div>
    );
  }

  const q = questions[currentIndex];

  // 決定按鈕樣式
  const getButtonStyle = (option) => {
    if (selectedAnswer === null) return {};
    if (option === q.answer) return { backgroundColor: 'var(--pixel-success)' }; // 提示正確答案
    if (option === selectedAnswer && selectedAnswer !== q.answer) return { backgroundColor: 'var(--pixel-error)' }; // 答錯的選項變紅
    return { opacity: 0.5 };
  };

  return (
    <div className="pixel-container">
      <h3 style={{ color: 'var(--pixel-success)', marginBottom: '10px' }}>
        STAGE {currentIndex + 1} / {questions.length}
      </h3>
      
      <StageMaster level={currentIndex + 1} />

      <h2 style={{ fontSize: '18px', marginBottom: '30px', minHeight: '54px' }}>
        {q.question}
      </h2>
      
      <div className="options-grid">
        <button className="pixel-btn" style={getButtonStyle('A')} onClick={() => handleAnswer('A')}>A. {q.A}</button>
        <button className="pixel-btn" style={getButtonStyle('B')} onClick={() => handleAnswer('B')}>B. {q.B}</button>
        <button className="pixel-btn" style={getButtonStyle('C')} onClick={() => handleAnswer('C')}>C. {q.C}</button>
        <button className="pixel-btn" style={getButtonStyle('D')} onClick={() => handleAnswer('D')}>D. {q.D}</button>
      </div>
    </div>
  );
}

export default Game;
