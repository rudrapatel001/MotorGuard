import { useState } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [msg, setMsg] = useState('');

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      await axios.put('http://localhost:8080/api/profile', { name }, config);
      updateUser(name);
      setMsg('Profile updated successfully!');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) { setMsg('Error updating profile'); }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border max-w-lg mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-6">User Profile</h2>
      {msg && <div className="mb-4 p-2 bg-blue-50 text-blue-700 rounded">{msg}</div>}
      
      <div className="mb-4">
        <label className="block text-gray-600 text-sm mb-1">Email Address (Read Only)</label>
        <input disabled value={user?.email} className="w-full p-2 border rounded bg-gray-100 text-gray-500" />
      </div>
      <div className="mb-6">
        <label className="block text-gray-600 text-sm mb-1">Assigned Role</label>
        <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-semibold text-sm">{user?.role}</span>
      </div>

      <form onSubmit={handleUpdate}>
        <div className="mb-4">
          <label className="block text-gray-600 text-sm mb-1">Display Name</label>
          <input required value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border rounded focus:border-blue-500 outline-none" />
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Update Profile</button>
      </form>
    </div>
  );
}