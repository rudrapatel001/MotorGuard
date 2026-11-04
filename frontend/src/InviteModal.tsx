import { useState } from 'react';
import axios from 'axios';
import { X, Copy, Check, Send } from 'lucide-react';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InviteModal({ isOpen, onClose }: InviteModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Viewer');
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        'http://localhost:8080/api/invite',
        { email, role },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInviteLink(res.data.invite_link);
    } catch (err) {
      alert('Failed to generate invite link. Ensure you have Admin permissions.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <Send className="w-5 h-5 mr-2 text-blue-600" /> Invite Team Member
        </h3>

        {!inviteLink ? (
          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Colleague's Email</label>
              <input
                type="email"
                required
                placeholder="colleague@factory.com"
                className="w-full border p-2 rounded outline-none focus:border-blue-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign Role</label>
              <select
                className="w-full border p-2 rounded outline-none focus:border-blue-500 bg-white"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="Viewer">Viewer (Read-only)</option>
                <option value="Engineer">Engineer (Manage Equipment & Status)</option>
                <option value="Admin">Admin (Full Control)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded transition-colors"
            >
              {loading ? 'Generating Link...' : 'Generate Invite Link'}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Share this secure invitation link with your team member:
            </p>
            <div className="flex items-center gap-2 bg-gray-50 p-2 border rounded">
              <input
                type="text"
                readOnly
                value={inviteLink}
                className="w-full bg-transparent text-sm text-gray-700 outline-none"
              />
              <button
                onClick={copyToClipboard}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm font-medium flex items-center transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <button
              onClick={() => { setInviteLink(''); setEmail(''); }}
              className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 rounded transition-colors"
            >
              Invite Another Member
            </button>
          </div>
        )}
      </div>
    </div>
  );
}