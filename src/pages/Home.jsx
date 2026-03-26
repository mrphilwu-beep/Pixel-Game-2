import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const [playerId, setPlayerId] = useState('');
  const navigate = useNavigate();

  const handleStart = () => {
    if (!playerId.trim()) {
      alert('請輸入玩家 ID');
      return;
    }
    // Save to localStorage
    localStorage.setItem('pixel_game_id', playerId.trim());
    navigate('/game');
  };

  return (
    <div className="pixel-container">
      <h1 style={{ color: 'var(--pixel-primary)' }}>PIXEL QUEST</h1>
      <h2>闖關問答遊戲</h2>
      <div style={{ margin: '40px 0' }}>
        <p style={{ marginBottom: '10px' }}>PLEASE ENTER YOUR ID</p>
        <input 
          className="pixel-input"
          type="text" 
          placeholder="USER_ID" 
          value={playerId}
          onChange={(e) => setPlayerId(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleStart()}
        />
      </div>
      <button className="pixel-btn" onClick={handleStart}>
        PRESS START
      </button>
    </div>
  );
}

export default Home;
