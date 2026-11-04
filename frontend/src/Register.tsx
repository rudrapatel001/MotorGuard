import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link, useLocation } from 'react-router-dom';

export default function Register() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'Engineer' });
  const [error, setError] = useState('');
  const [isInvite, setIsInvite] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const email = params.get('email');
    if (token) {
      setIsInvite(true);
      if (email) {
        setFormData(prev => ({ ...prev, email }));
      }
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const params = new URLSearchParams(location.search);
      const token = params.get('token');
      
      let url = 'http://localhost:8080/api/auth/register';
      if (token) {
        url += `?token=${token}`;
      }

      await axios.post(url, formData);
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-2 text-center">
          {isInvite ? 'Join Team' : 'Register Organization'}
        </h2>
        {isInvite && (
          <p className="text-xs text-center text-blue-600 mb-4 font-medium">
            You've been invited to join an existing organization.
          </p>
        )}
        
        {error && <div className="text-red-500 mb-4 text-sm text-center bg-red-50 p-2 rounded">{error}</div>}
        
        <input 
          type="text" placeholder="Full Name" required className="w-full p-2 border rounded mb-4 outline-none focus:border-blue-500"
          value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
        />
        
        <input 
          type="email" placeholder="Email" required disabled={isInvite}
          className={`w-full p-2 border rounded mb-4 outline-none ${isInvite ? 'bg-gray-100 cursor-not-allowed' : 'focus:border-blue-500'}`}
          value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
        />
        
        <input 
          type="password" placeholder="Password" required className="w-full p-2 border rounded mb-4 outline-none focus:border-blue-500"
          value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})}
        />

        {!isInvite && (
          <select 
            className="w-full p-2 border rounded mb-6 outline-none bg-white"
            value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}
          >
            <option value="Admin">Admin</option>
            <option value="Engineer">Engineer</option>
            <option value="Viewer">Viewer</option>
          </select>
        )}

        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded font-medium transition-colors">
          {isInvite ? 'Accept Invitation & Register' : 'Register'}
        </button>
        
        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account? <Link to="/login" className="text-blue-600 font-medium">Login</Link>
        </p>
      </form>
    </div>
  );
}