import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { Plus, Trash2, MapPin, Power, UserPlus } from 'lucide-react';
import InviteModal from './InviteModal';

export default function Management() {
  const { user } = useAuth();
  const [data, setData] = useState({ facilities: [], equipment: [] });
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  
  // Facility Form States
  const [facName, setFacName] = useState('');
  const [facLocation, setFacLocation] = useState('');

  // Expanded Equipment Form States (including installation_date)
  const [eqForm, setEqForm] = useState({
    facility_id: '',
    name: '',
    motor_type: 'AC Induction',
    rated_voltage: '415',
    rated_current: '10',
    rated_rpm: '1500',
    installation_date: new Date().toISOString().split('T')[0]
  });

  const fetchData = async () => {
    const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
    try {
      const [facRes, eqRes] = await Promise.all([
        axios.get('http://localhost:8080/api/facilities', config),
        axios.get('http://localhost:8080/api/equipment', config)
      ]);
      setData({ facilities: facRes.data || [], equipment: eqRes.data || [] });
    } catch (err) {
      console.error("Failed to load management data");
    }
  };

  useEffect(() => { fetchData(); }, []);

  const createFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:8080/api/facilities', { name: facName, location: facLocation }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setFacName(''); 
      setFacLocation(''); 
      fetchData();
    } catch (err) { alert('Error creating facility'); }
  };

  const createEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        facility_id: parseInt(eqForm.facility_id),
        name: eqForm.name,
        motor_type: eqForm.motor_type,
        rated_voltage: parseFloat(eqForm.rated_voltage),
        rated_current: parseFloat(eqForm.rated_current),
        rated_rpm: parseInt(eqForm.rated_rpm),
        installation_date: eqForm.installation_date
      };

      await axios.post('http://localhost:8080/api/equipment', payload, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      
      // Reset form fields
      setEqForm({ 
        facility_id: '', 
        name: '', 
        motor_type: 'AC Induction', 
        rated_voltage: '415', 
        rated_current: '10', 
        rated_rpm: '1500',
        installation_date: new Date().toISOString().split('T')[0]
      });
      fetchData();
    } catch (err) { alert('Error creating equipment'); }
  };

  const deleteEquipment = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this equipment? This action cannot be undone.")) return;
    try {
      await axios.delete(`http://localhost:8080/api/equipment/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      fetchData();
    } catch (err) { alert('Failed to delete. Ensure you have Admin privileges.'); }
  };

  const toggleStatus = async (eq: any) => {
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      const newStatus = eq.status === 'Active' ? 'Inactive' : 'Active';
      await axios.put(`http://localhost:8080/api/equipment/${eq.id}`, { name: eq.name, status: newStatus }, config);
      fetchData();
    } catch (err) { alert('Failed to update status.'); }
  };

  return (
    <div className="space-y-6">
      {/* Header and Admin Invite Button */}
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-bold text-gray-800">Management Console</h2>
        {user?.role === 'Admin' && (
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center transition-colors shadow-sm text-sm"
          >
            <UserPlus className="w-4 h-4 mr-2" /> Invite Team Member
          </button>
        )}
      </div>
      
      {/* Creation Forms (Hidden from Viewers) */}
      {user?.role !== 'Viewer' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Facility Form */}
          <form onSubmit={createFacility} className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
            <h3 className="font-semibold mb-3 flex items-center text-gray-700"><Plus className="w-4 h-4 mr-1"/> Add New Facility</h3>
            <div className="space-y-3">
              <input required placeholder="Facility Name" className="border p-2 rounded w-full outline-none focus:border-blue-500" value={facName} onChange={e => setFacName(e.target.value)} />
              <input required placeholder="Location" className="border p-2 rounded w-full outline-none focus:border-blue-500" value={facLocation} onChange={e => setFacLocation(e.target.value)} />
              <button className="w-full bg-blue-600 hover:bg-blue-700 transition-colors text-white py-2 rounded font-medium">Add Facility</button>
            </div>
          </form>
          
          {/* Expanded Equipment Form */}
          <form onSubmit={createEquipment} className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
            <h3 className="font-semibold mb-3 flex items-center text-gray-700"><Plus className="w-4 h-4 mr-1"/> Add New Equipment</h3>
            <div className="space-y-3">
              <select required className="border p-2 rounded w-full outline-none focus:border-emerald-500 bg-white" value={eqForm.facility_id} onChange={e => setEqForm({...eqForm, facility_id: e.target.value})}>
                <option value="">Select Facility...</option>
                {data.facilities.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>

              <div className="grid grid-cols-2 gap-2">
                <input required placeholder="Motor Name / ID" className="border p-2 rounded w-full outline-none focus:border-emerald-500" value={eqForm.name} onChange={e => setEqForm({...eqForm, name: e.target.value})} />
                <input required placeholder="Motor Type (e.g. AC Induction)" className="border p-2 rounded w-full outline-none focus:border-emerald-500" value={eqForm.motor_type} onChange={e => setEqForm({...eqForm, motor_type: e.target.value})} />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Rated Voltage (V)</label>
                  <input required type="number" step="0.1" className="border p-2 rounded w-full outline-none focus:border-emerald-500" value={eqForm.rated_voltage} onChange={e => setEqForm({...eqForm, rated_voltage: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Rated Current (A)</label>
                  <input required type="number" step="0.1" className="border p-2 rounded w-full outline-none focus:border-emerald-500" value={eqForm.rated_current} onChange={e => setEqForm({...eqForm, rated_current: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Rated RPM</label>
                  <input required type="number" className="border p-2 rounded w-full outline-none focus:border-emerald-500" value={eqForm.rated_rpm} onChange={e => setEqForm({...eqForm, rated_rpm: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1">Installation Date</label>
                <input required type="date" className="border p-2 rounded w-full outline-none focus:border-emerald-500 text-sm" value={eqForm.installation_date} onChange={e => setEqForm({...eqForm, installation_date: e.target.value})} />
              </div>

              <button className="w-full bg-emerald-600 hover:bg-emerald-700 transition-colors text-white py-2 rounded font-medium mt-1">Add Equipment</button>
            </div>
          </form>
        </div>
      )}

      {/* Facility List Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b bg-gray-50 flex items-center">
          <MapPin className="w-5 h-5 mr-2 text-blue-600"/>
          <h2 className="font-semibold text-gray-800">Facility Directory</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-100 text-gray-600 text-sm">
              <tr>
                <th className="px-6 py-3 font-medium">S.No.</th>
                <th className="px-6 py-3 font-medium">Facility Name</th>
                <th className="px-6 py-3 font-medium">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.facilities.length === 0 ? (
                <tr><td colSpan={3} className="px-6 py-6 text-center text-gray-500">No facilities registered.</td></tr>
              ) : data.facilities.map((fac: any, index: number) => (
                <tr key={fac.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-500">{index + 1}</td>
                  <td className="px-6 py-4 font-medium text-gray-800">{fac.name}</td>
                  <td className="px-6 py-4 text-gray-600">{fac.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expanded Equipment List Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h2 className="font-semibold text-gray-800">Equipment Directory</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-100 text-gray-600 text-sm">
              <tr>
                <th className="px-6 py-3 font-medium">S.No.</th>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Facility</th>
                <th className="px-6 py-3 font-medium">Motor Type</th>
                <th className="px-6 py-3 font-medium">Voltage</th>
                <th className="px-6 py-3 font-medium">Current</th>
                <th className="px-6 py-3 font-medium">RPM</th>
                <th className="px-6 py-3 font-medium">Installed</th>
                <th className="px-6 py-3 font-medium">Status</th>
                {user?.role !== 'Viewer' && <th className="px-6 py-3 font-medium text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.equipment.length === 0 ? (
                <tr><td colSpan={10} className="px-6 py-6 text-center text-gray-500">No equipment registered.</td></tr>
              ) : data.equipment.map((eq: any, index: number) => {
                const parentFacility = data.facilities.find((f: any) => f.id === eq.facility_id);
                
                return (
                  <tr key={eq.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-500">{index + 1}</td>
                    <td className="px-6 py-4 font-medium text-gray-800">{eq.name}</td>
                    <td className="px-6 py-4 text-gray-600">{parentFacility ? (parentFacility as any).name : 'Unknown'}</td>
                    <td className="px-6 py-4 text-gray-600 text-sm">{eq.motor_type || 'Standard'}</td>
                    <td className="px-6 py-4 text-gray-600 text-sm">{eq.rated_voltage}V</td>
                    <td className="px-6 py-4 text-gray-600 text-sm">{eq.rated_current}A</td>
                    <td className="px-6 py-4 text-gray-600 text-sm">{eq.rated_rpm}</td>
                    <td className="px-6 py-4 text-gray-600 text-sm">{eq.installation_date || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full font-semibold ${eq.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'}`}>
                        {eq.status}
                      </span>
                    </td>
                    
                    {user?.role !== 'Viewer' && (
                      <td className="px-6 py-4 text-right flex justify-end gap-2">
                        <button 
                          onClick={() => toggleStatus(eq)} 
                          className="text-orange-500 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 p-2 rounded transition-colors"
                          title={eq.status === 'Active' ? "Mark Inactive" : "Mark Active"}
                        >
                          <Power className="w-4 h-4" />
                        </button>

                        {user?.role === 'Admin' && (
                          <button 
                            onClick={() => deleteEquipment(eq.id)} 
                            className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded transition-colors"
                            title="Delete Equipment"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <InviteModal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} />
    </div>
  );
}