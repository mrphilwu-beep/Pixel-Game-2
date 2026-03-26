import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Game from './pages/Game';
import Result from './pages/Result';
import './index.css';

function App() {
  return (
    // 加入 basename 取用 Vite 的 base 設定，解決 GitHub Pages 路由導致的白畫面
    <Router basename={import.meta.env.BASE_URL}>
      <div className="app-wrapper">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/game" element={<Game />} />
          <Route path="/result" element={<Result />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
