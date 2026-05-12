import { Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import { useUser } from './contexts/userContextCore';
import DashboardRoutes from './components/DashboardRoutes';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';

function App() {
  const { user, loading, refreshUser } = useUser();

  if (loading) {
    return (
      <main className="app-status" aria-live="polite">
        <img src="/logo/TopGearInitials.png" alt="TopGear" />
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to={user ? '/home' : '/login'} replace />} />
      <Route
        path="/login"
        element={user ? <Navigate to="/home" replace /> : <LoginPage onLoginSuccess={refreshUser} />}
      />
      <Route
        path="/home/*"
        element={user ? <DashboardRoutes user={user} /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/signup"
        element={user ? <Navigate to="/home" replace /> : <SignupPage onLoginSuccess={refreshUser} />}
      />
      <Route
        path="/forgot-password"
        element={user ? <Navigate to="/home"  replace /> : <ForgotPasswordPage />}
      />
      <Route path="*" element={<Navigate to={user ? '/home' : '/login'} replace />} />
    </Routes>
  );
}

export default App;
