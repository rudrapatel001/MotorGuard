import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'Engineer' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:8080/api/auth/register', formData);
      navigate('/login');
    } catch (err) {
      setError('Registration failed');
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Register Organization</h2>
        {error && <div className="text-red-500 mb-4 text-sm">{error}</div>}
        <input 
          type="text" placeholder="Name" required className="w-full p-2 border rounded mb-4"
          value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
        />
        <input 
          type="email" placeholder="Email" required className="w-full p-2 border rounded mb-4"
          value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
        />
        <input 
          type="password" placeholder="Password" required className="w-full p-2 border rounded mb-4"
          value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})}
        />
        <select 
          className="w-full p-2 border rounded mb-6"
          value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}
        >
          <option value="Admin">Admin</option>
          <option value="Engineer">Engineer</option>
          <option value="Viewer">Viewer</option>
        </select>
        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">Register</button>
        <p className="mt-4 text-center text-sm text-gray-600">
          <Link to="/login" className="text-blue-600">Back to Login</Link>
        </p>
      </form>
    </div>
  );
}