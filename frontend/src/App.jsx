import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';

import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

import Home from './pages/public/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

import StudentDashboard from './pages/student/StudentDashboard';
import StudentProfile from './pages/student/StudentProfile';

import ProtectedRoute from './routes/ProtectedRoute';

// Layout for public pages
const PublicLayout = () => {
  return (
    <>
      <Navbar />
      <Outlet />
      <Footer />
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Student routes */}
        <Route
          element={<ProtectedRoute allowedRoles={['student']} />}
        >
          <Route
            path="/student/dashboard"
            element={<StudentDashboard />}
          />
          <Route
            path='/student/profile'
            element={<StudentProfile />}
          />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;

