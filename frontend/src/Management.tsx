import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { Plus, Trash2, MapPin } from 'lucide-react';

export default function Management() {
  const { user } = useAuth();
  const [data, setData] = useState({ facilities: [], equipment: [] });
  
  // Form States
  const [facName, setFacName] = useState('');
  const [facLocation, setFacLocation] = useState('');
  const [eqName, setEqName] = useState('');
  const [eqFacility, setEqFacility] = useState('');

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
      await axios.post('http://localhost:8080/api/equipment', { facility_id: parseInt(eqFacility), name: eqName }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setEqName(''); 
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

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Management Console</h2>
      
      {/* Creation Forms (Hidden from Viewers) */}
      {user?.role !== 'Viewer' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Facility Form */}
          <form onSubmit={createFacility} className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
            <h3 className="font-semibold mb-3 flex items-center text-gray-700"><Plus className="w-4 h-4 mr-1"/> Add New Facility</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <input required placeholder="Facility Name" className="border p-2 rounded w-full outline-none focus:border-blue-500" value={facName} onChange={e => setFacName(e.target.value)} />
              <input required placeholder="Location" className="border p-2 rounded w-full outline-none focus:border-blue-500" value={facLocation} onChange={e => setFacLocation(e.target.value)} />
              <button className="bg-blue-600 hover:bg-blue-700 transition-colors text-white px-6 py-2 rounded font-medium">Add</button>
            </div>
          </form>
          
          {/* Equipment Form */}
          <form onSubmit={createEquipment} className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
            <h3 className="font-semibold mb-3 flex items-center text-gray-700"><Plus className="w-4 h-4 mr-1"/> Add New Equipment</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <select required className="border p-2 rounded w-full outline-none focus:border-emerald-500 bg-white" value={eqFacility} onChange={e => setEqFacility(e.target.value)}>
                <option value="">Select Facility...</option>
                {data.facilities.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
              <input required placeholder="Motor Name" className="border p-2 rounded w-full outline-none focus:border-emerald-500" value={eqName} onChange={e => setEqName(e.target.value)} />
              <button className="bg-emerald-600 hover:bg-emerald-700 transition-colors text-white px-6 py-2 rounded font-medium">Add</button>
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
                  {/* Display sequential row number instead of database ID */}
                  <td className="px-6 py-4 text-gray-500">{index + 1}</td>
                  <td className="px-6 py-4 font-medium text-gray-800">{fac.name}</td>
                  <td className="px-6 py-4 text-gray-600">{fac.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Equipment List Table */}
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
                <th className="px-6 py-3 font-medium">Status</th>
                {user?.role === 'Admin' && <th className="px-6 py-3 font-medium text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.equipment.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-6 text-center text-gray-500">No equipment registered.</td></tr>
              ) : data.equipment.map((eq: any, index: number) => {
                // Look up the facility name based on the equipment's facility_id
                const parentFacility = data.facilities.find((f: any) => f.id === eq.facility_id);
                
                return (
                  <tr key={eq.id} className="hover:bg-gray-50">
                    {/* Display sequential row number instead of database ID */}
                    <td className="px-6 py-4 text-gray-500">{index + 1}</td>
                    <td className="px-6 py-4 font-medium text-gray-800">{eq.name}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {parentFacility ? (parentFacility as any).name : 'Unknown Facility'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full font-semibold ${eq.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'}`}>
                        {eq.status}
                      </span>
                    </td>
                    {user?.role === 'Admin' && (
                      <td className="px-6 py-4 text-right flex justify-end">
                        <button 
                          onClick={() => deleteEquipment(eq.id)} 
                          className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded transition-colors"
                          title="Delete Equipment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}