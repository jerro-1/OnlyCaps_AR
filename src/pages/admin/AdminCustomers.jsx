import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import supabase from '../../utils/supabase';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [savingId, setSavingId] = useState(null);

  useEffect(() => { fetchCustomers(); }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, firstname, lastname, email, role, created_at');
    if (error) console.error(error);
    setCustomers(data || []);
    setLoading(false);
  };

  const handleRoleChange = async (customer, newRole) => {
    if (newRole === customer.role) return;

    if (newRole === 'customer' && customer.role === 'admin') {
      const confirmed = confirm(`Remove admin access from ${customer.firstname || customer.email}?`);
      if (!confirmed) return;
    }

    setSavingId(customer.id);
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', customer.id);

    if (error) {
      alert(error.message);
    } else {
      setCustomers(prev => prev.map(c => c.id === customer.id ? { ...c, role: newRole } : c));
    }
    setSavingId(null);
  };

  const visible = customers.filter(c =>
    `${c.firstname} ${c.lastname} ${c.email}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-1 text-[#14110D]">Customers</h1>
      <p className="text-sm text-gray-500 mb-6">Everyone with an account on OnlyCaps.</p>

      <input
        placeholder="Search by name or email..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="border rounded-lg px-3 py-2 text-sm mb-4 w-full max-w-sm"
      />

      {loading ? <p>Loading...</p> : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Role</th><th className="p-3">Joined</th></tr>
            </thead>
            <tbody>
              {visible.map(c => (
                <tr key={c.id} className="border-t">
                  <td className="p-3 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#A9824C] text-[#14110D] flex items-center justify-center text-xs font-semibold flex-shrink-0">
                      {((c.firstname?.[0] ?? '') + (c.lastname?.[0] ?? '')).toUpperCase() || '?'}
                    </div>
                    {c.firstname} {c.lastname}
                  </td>
                  <td className="p-3">{c.email}</td>
                  <td className="p-3">
                    <select
                      value={c.role || 'customer'}
                      onChange={e => handleRoleChange(c, e.target.value)}
                      disabled={savingId === c.id}
                      className={`px-2 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${
                        c.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      <option value="customer">Customer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="p-3 text-gray-500">{c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}