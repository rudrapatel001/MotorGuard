import { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity } from 'lucide-react';

export default function Readings() {
  const [equipment, setEquipment] = useState([]);
  const [msg, setMsg] = useState({ text: '', type: '' });
  
  // Form State
  const [formData, setFormData] = useState({
    equipment_id: '',
    voltage: '',
    current: '',
    frequency: '50',
    temperature: '',
    vibration: '',
    timestamp: ''
  });

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
        const res = await axios.get('http://localhost:8080/api/equipment', config);
        setEquipment(res.data || []);
      } catch (err) {
        console.error("Failed to fetch equipment list");
      }
    };
    fetchEquipment();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.equipment_id) {
      setMsg({ text: 'Please select an equipment.', type: 'error' });
      return;
    }

    // Build payload, converting strings to numbers where necessary
    const payload = {
      equipment_id: parseInt(formData.equipment_id),
      voltage: parseFloat(formData.voltage),
      current: parseFloat(formData.current),
      frequency: parseFloat(formData.frequency),
      temperature: parseFloat(formData.temperature),
      vibration: parseFloat(formData.vibration),
      // Use provided timestamp or default to current ISO string
      timestamp: formData.timestamp ? new Date(formData.timestamp).toISOString() : new Date().toISOString()
    };

    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      await axios.post('http://localhost:8080/api/readings', payload, config);
      
      setMsg({ text: 'Reading submitted successfully! Any faults have been logged.', type: 'success' });
      
      // Reset form but keep equipment selected
      setFormData(prev => ({
        ...prev,
        voltage: '', current: '', temperature: '', vibration: '', timestamp: ''
      }));
      
      setTimeout(() => setMsg({ text: '', type: '' }), 4000);
    } catch (err) {
      setMsg({ text: 'Failed to submit reading. Check permissions.', type: 'error' });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border max-w-2xl mx-auto mt-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center text-gray-800">
        <Activity className="w-6 h-6 mr-2 text-blue-600" />
        Manual Telemetry Entry
      </h2>
      
      {msg.text && (
        <div className={`mb-6 p-3 rounded text-sm font-medium ${msg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {msg.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-600 text-sm mb-1 font-medium">Target Equipment</label>
          <select 
            required name="equipment_id" value={formData.equipment_id} onChange={handleChange}
            className="w-full p-2 border rounded bg-gray-50 focus:border-blue-500 outline-none"
          >
            <option value="">Select equipment...</option>
            {equipment.map((eq: any) => (
              <option key={eq.id} value={eq.id}>{eq.name} (Facility #{eq.facility_id})</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-600 text-sm mb-1 font-medium">Voltage (V)</label>
            <input 
              required type="number" step="0.1" name="voltage" placeholder="e.g. 415"
              value={formData.voltage} onChange={handleChange}
              className="w-full p-2 border rounded focus:border-blue-500 outline-none" 
            />
          </div>
          <div>
            <label className="block text-gray-600 text-sm mb-1 font-medium">Current (A)</label>
            <input 
              required type="number" step="0.1" name="current" placeholder="e.g. 12.5"
              value={formData.current} onChange={handleChange}
              className="w-full p-2 border rounded focus:border-blue-500 outline-none" 
            />
          </div>
          <div>
            <label className="block text-gray-600 text-sm mb-1 font-medium">Temperature (°C)</label>
            <input 
              required type="number" step="0.1" name="temperature" placeholder="e.g. 65"
              value={formData.temperature} onChange={handleChange}
              className="w-full p-2 border rounded focus:border-blue-500 outline-none" 
            />
          </div>
          <div>
            <label className="block text-gray-600 text-sm mb-1 font-medium">Vibration (mm/s)</label>
            <input 
              required type="number" step="0.1" name="vibration" placeholder="e.g. 2.1"
              value={formData.vibration} onChange={handleChange}
              className="w-full p-2 border rounded focus:border-blue-500 outline-none" 
            />
          </div>
          <div>
            <label className="block text-gray-600 text-sm mb-1 font-medium">Frequency (Hz)</label>
            <input 
              required type="number" step="0.1" name="frequency"
              value={formData.frequency} onChange={handleChange}
              className="w-full p-2 border rounded focus:border-blue-500 outline-none" 
            />
          </div>
          <div>
            <label className="block text-gray-600 text-sm mb-1 font-medium">Timestamp (Optional)</label>
            <input 
              type="datetime-local" name="timestamp"
              value={formData.timestamp} onChange={handleChange}
              className="w-full p-2 border rounded focus:border-blue-500 outline-none text-sm" 
            />
            <p className="text-xs text-gray-400 mt-1">Leave blank to use current time</p>
          </div>
        </div>

        <div className="pt-4 border-t mt-6">
          <button type="submit" className="w-full bg-blue-600 text-white px-4 py-3 rounded font-medium hover:bg-blue-700 transition-colors">
            Submit Reading
          </button>
        </div>
      </form>
    </div>
  );
}