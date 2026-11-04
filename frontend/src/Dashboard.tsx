import { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, AlertTriangle, Zap, Thermometer, CheckCircle } from 'lucide-react';

export default function Dashboard() {
  // Main Data State
  const [data, setData] = useState({ 
    equipment: [], 
    alerts: [], 
    metrics: { total_facilities: 0, total_equipment: 0, active_equipment: 0, critical_alerts: 0 } 
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Chart & Telemetry States
  const [telemetry, setTelemetry] = useState([]);
  const [selectedEqChart, setSelectedEqChart] = useState<string>('');
  const [dateRange, setDateRange] = useState<string>('all');

  // 1. Fetch Initial Dashboard Data (Equipment, Alerts, Analytics)
  const fetchDashboardData = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      
      const [eqRes, alertsRes, analyticsRes] = await Promise.all([
        axios.get('http://localhost:8080/api/equipment', config),
        axios.get('http://localhost:8080/api/alerts', config),
        axios.get('http://localhost:8080/api/analytics', config)
      ]);

      setData({
        equipment: eqRes.data || [],
        alerts: alertsRes.data || [],
        metrics: analyticsRes.data || { total_facilities: 0, total_equipment: 0, active_equipment: 0, critical_alerts: 0 }
      });
      
      // Auto-select the first piece of equipment for the charts if not already selected
      if (!selectedEqChart && eqRes.data?.length > 0) {
        setSelectedEqChart(eqRes.data[0].id.toString());
      }
      setLoading(false);
    } catch (err) {
      setError('Failed to load dashboard data. Ensure backend is running.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // 2. Fetch Telemetry Data specifically for the selected equipment and date range
  useEffect(() => {
    if (!selectedEqChart) return;
    
    const fetchTelemetry = async () => {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      let start = '1970-01-01';
      if (dateRange === 'today') {
        start = new Date().toISOString().split('T')[0];
      }
      
      try {
        const res = await axios.get(`http://localhost:8080/api/readings/${selectedEqChart}?start=${start}`, config);
        
        const formatted = (res.data || []).map((d: any) => ({
          ...d,
          time: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));
        setTelemetry(formatted);
      } catch (e) { 
        console.error("Error fetching telemetry"); 
      }
    };
    
    fetchTelemetry();
  }, [selectedEqChart, dateRange]);

  // 3. Resolve Alert Handler
  const resolveAlert = async (id: number) => {
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      await axios.patch(`http://localhost:8080/api/alerts/${id}/status`, {}, config);
      fetchDashboardData(); // Refresh to update alert status and metrics
    } catch (err) { alert('Error resolving alert'); }
  };

  if (loading) return <div className="flex h-screen items-center justify-center text-xl font-semibold text-gray-600">Loading Dashboard...</div>;
  if (error) return <div className="p-4 bg-red-100 text-red-700 m-4 rounded-lg">{error}</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Facility Overview</h2>
      
      {/* Analytics Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-full"><Activity className="text-blue-600" /></div>
          <div>
            <p className="text-sm text-gray-500">Total Equipment</p>
            <p className="text-2xl font-bold">{data.metrics.total_equipment}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-green-100 rounded-full"><CheckCircle className="text-green-600" /></div>
          <div>
            <p className="text-sm text-gray-500">Active Status</p>
            <p className="text-2xl font-bold">{data.metrics.active_equipment}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-red-100 rounded-full"><AlertTriangle className="text-red-600" /></div>
          <div>
            <p className="text-sm text-gray-500">Unresolved Critical Alerts</p>
            <p className="text-2xl font-bold text-red-600">{data.metrics.critical_alerts}</p>
          </div>
        </div>
      </div>

      {/* Telemetry Charts Section */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 mb-2">
        <div className="w-full sm:w-64">
          <label className="text-sm font-medium text-gray-600 block mb-1">Equipment Chart Filter</label>
          <select className="border p-2 rounded w-full bg-gray-50" value={selectedEqChart} onChange={e => setSelectedEqChart(e.target.value)}>
            {data.equipment.length === 0 && <option value="">No equipment available</option>}
            {data.equipment.map((eq: any) => <option key={eq.id} value={eq.id}>{eq.name}</option>)}
          </select>
        </div>
        <div className="w-full sm:w-48">
          <label className="text-sm font-medium text-gray-600 block mb-1">Date Range</label>
          <select className="border p-2 rounded w-full bg-gray-50" value={dateRange} onChange={e => setDateRange(e.target.value)}>
            <option value="all">All Time</option>
            <option value="today">Today</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Temperature Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4 flex items-center"><Thermometer className="mr-2 h-5 w-5 text-orange-500"/> Temperature Trend (°C)</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={telemetry}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="time" stroke="#6b7280" />
                <YAxis domain={['auto', 'auto']} stroke="#6b7280" />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="temperature" stroke="#f97316" strokeWidth={2} dot={{ r: 3, fill: '#f97316' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Current Draw Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4 flex items-center"><Zap className="mr-2 h-5 w-5 text-yellow-500"/> Current Draw (Amps)</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={telemetry}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="time" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="current" fill="#eab308" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Fault Alerts Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mt-6">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800">Fault Alert History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-gray-500 text-sm border-b border-gray-100">
                <th className="px-6 py-3 font-medium">Equipment</th>
                <th className="px-6 py-3 font-medium">Parameter</th>
                <th className="px-6 py-3 font-medium">Severity</th>
                <th className="px-6 py-3 font-medium">Message</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.alerts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No alerts detected yet. All systems normal.</td>
                </tr>
              ) : data.alerts.map((alert: any) => (
                <tr key={alert.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-800">{alert.equip_name}</td>
                  <td className="px-6 py-4 capitalize text-gray-600">{alert.parameter}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                      alert.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {alert.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">{alert.message}</td>
                  <td className="px-6 py-4">
                    {alert.is_resolved ? (
                      <span className="text-emerald-600 font-medium flex items-center text-sm"><CheckCircle className="h-4 w-4 mr-1"/> Resolved</span>
                    ) : (
                      <button 
                        onClick={() => resolveAlert(alert.id)} 
                        className="text-blue-600 hover:text-blue-800 font-semibold text-sm transition-colors"
                      >
                        Acknowledge
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}