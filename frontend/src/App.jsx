import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import MyOrders from './pages/MyOrders';
import Profile from './pages/Profile';
import AdminAddBook from './pages/AdminAddBook';

function App() {
  return (
    <Router>
      <div className="app-shell">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<MyOrders />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin/add-book" element={<AdminAddBook />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;