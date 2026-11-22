import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';

import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

import Home from './pages/public/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

import StudentDashboard from './pages/student/StudentDashboard';
import StudentProfile from './pages/student/StudentProfile';
import StudentResume from './pages/student/StudentResume';
import StudentCompanies from './pages/student/StudentCompanies';
import StudentCompanyDetails from './pages/student/StudentCompanyDetails';
import StudentJobs from './pages/student/StudentJobs';
import StudentJobDetails from './pages/student/StudentJobDetails';

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

          <Route
            path="/student/resume"
            element={<StudentResume />}
          />
          
          <Route
            path="/student/companies"
            element={<StudentCompanies />}
          />

          <Route
            path="/student/companies/:id"
            element={<StudentCompanyDetails />}
          />

          <Route
            path="/student/jobs"
            element={<StudentJobs />}
          />

          <Route
            path="/student/jobs/:id"
            element={<StudentJobDetails />}
          />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;

