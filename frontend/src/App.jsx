import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Home from './pages/public/Home';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';


function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <h1 className="text-3xl font-bold">
        Login
      </h1>
    </div>
  );
}


function App() {
  return (
    <BrowserRouter>

      <Navbar />

      <Routes>

        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />

      </Routes>

      <Footer />

    </BrowserRouter>
  );
}


export default App;
