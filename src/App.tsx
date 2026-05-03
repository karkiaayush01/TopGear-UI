import { Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import { useUser } from './contexts/UserContext';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';

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
        path="/home"
        element={user ? <HomePage user={user} /> : <Navigate to="/login" replace />}
      />
      <Route path="*" element={<Navigate to={user ? '/home' : '/login'} replace />} />
    </Routes>
  );
}

export default App;
