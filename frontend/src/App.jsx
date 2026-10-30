import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';


export default function App() {
  return (
    <Router>
      <Routes>
        {/* กำหนดให้หน้าแรก (path="/") แสดง Component Home */}
        <Route path="/" element={<Home />} />
      </Routes>
    </Router>
  );
}
