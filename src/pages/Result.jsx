import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { submitScore } from '../api/googleService';

function Result() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const hasSaved = useRef(false); // 避免 React StrictMode 造成的雙重發送
  
  const score = location.state?.score || 0;
  const total = location.state?.total || 5;
  const playerId = localStorage.getItem('pixel_game_id');
  const threshold = parseInt(import.meta.env.VITE_PASS_THRESHOLD || '3', 10);
  const passed = score >= threshold;

  useEffect(() => {
    if (!playerId || location.state === null) {
      navigate('/');
      return;
    }

    const saveResult = async () => {
      if (hasSaved.current) return;
      hasSaved.current = true;
      
      setLoading(true);
      await submitScore(playerId, score, passed, 1);
      setSaved(true);
      setLoading(false);
    };

    saveResult();
  }, [playerId, score, passed, navigate, location.state]);

  if (!playerId || location.state === null) return null;

  return (
    <div className="pixel-container">
      <h1 style={{ color: passed ? 'var(--pixel-success)' : 'var(--pixel-error)' }}>
        {passed ? 'MISSION CLEARED' : 'GAME OVER'}
      </h1>
      
      <div style={{ margin: '30px 0' }}>
        <h2 style={{ fontSize: '24px' }}>SCORE: {score} / {total}</h2>
        <p style={{ marginTop: '10px' }}>PLAYER: {playerId}</p>
      </div>

      {loading ? (
        <p className="pixel-text-small" style={{ color: 'var(--pixel-error)' }}>SAVING RECORD...</p>
      ) : (
        <p className="pixel-text-small" style={{ color: 'var(--pixel-success)' }}>
          {saved ? 'RECORD SAVED TO SERVER!' : 'FAILED TO SAVE RECORD'}
        </p>
      )}

      <div style={{ marginTop: '40px' }}>
        <button className="pixel-btn" onClick={() => navigate('/')}>
          PLAY AGAIN
        </button>
      </div>
    </div>
  );
}

export default Result;
