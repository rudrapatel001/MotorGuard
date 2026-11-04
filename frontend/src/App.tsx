import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Login from './Login';
import Register from './Register';
import Dashboard from './Dashboard';
import Management from './Management';
import Profile from './Profile';
import Readings from './Readings'; // New import

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  return token ? <>{children}</> : <Navigate to="/login" />;
}

function MainLayout() {
  const { logout, user } = useAuth();
  const location = useLocation();
  const navClass = (path: string) => `px-3 py-2 rounded font-medium transition-colors ${location.pathname === path ? 'bg-slate-700 text-white' : 'text-gray-300 hover:bg-slate-800 hover:text-white'}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-slate-900 text-white p-4 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <div className="font-bold text-xl tracking-wide mr-4">MotorGuard<span className="text-blue-400">.</span></div>
            <Link to="/" className={navClass('/')}>Dashboard</Link>
            <Link to="/management" className={navClass('/management')}>Management</Link>
            <Link to="/readings" className={navClass('/readings')}>Readings</Link>
            <Link to="/profile" className={navClass('/profile')}>Profile</Link>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-300">Role: <span className="font-semibold text-white">{user?.role}</span></span>
            <button onClick={logout} className="text-sm bg-slate-800 px-3 py-1 rounded hover:bg-slate-700 transition-colors">Logout</button>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/management" element={<Management />} />
          <Route path="/readings" element={<Readings />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/*" element={<ProtectedRoute><MainLayout /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}