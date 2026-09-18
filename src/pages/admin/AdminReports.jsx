import { useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import supabase from '../../utils/supabase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const CYAN = '#9CE1F0';
const BLACK = '#000000';

export default function AdminReports() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [generating, setGenerating] = useState(false);

  const generateSalesReport = async () => {
    setGenerating(true);
    let query = supabase.from('orders').select('id, total, status, created_at').order('created_at', { ascending: true });
    if (dateFrom) query = query.gte('created_at', dateFrom);
    if (dateTo) query = query.lte('created_at', dateTo);
    const { data, error } = await query;
    setGenerating(false);
    if (error) return alert(error.message);

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('OnlyCaps - Sales Report', 14, 18);
    doc.setFontSize(10);
    doc.text(`Range: ${dateFrom || 'all time'} to ${dateTo || 'present'}`, 14, 25);

    const rows = (data || []).map(o => [o.id, o.status, new Date(o.created_at).toLocaleDateString(), `₱${o.total}`]);
    const totalRevenue = (data || []).reduce((sum, o) => sum + (o.total || 0), 0);

    autoTable(doc, { startY: 32, head: [['Order ID', 'Status', 'Date', 'Total']], body: rows });

    const finalY = doc.lastAutoTable.finalY || 32;
    doc.setFontSize(12);
    doc.text(`Total Revenue: ₱${totalRevenue}`, 14, finalY + 10);
    doc.save('onlycaps-sales-report.pdf');
  };

  const generateInventoryReport = async () => {
    setGenerating(true);
    const { data, error } = await supabase.from('products').select('name, category, stock_quantity, price').order('category');
    setGenerating(false);
    if (error) return alert(error.message);

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('OnlyCaps - Inventory Report', 14, 18);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 25);

    const rows = (data || []).map(p => [
      p.name, p.category, p.stock_quantity,
      p.stock_quantity <= 5 ? 'LOW STOCK' : 'OK',
      `₱${p.price}`,
    ]);

    autoTable(doc, {
      startY: 32,
      head: [['Product', 'Category', 'Stock', 'Flag', 'Price']],
      body: rows,
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 3 && data.cell.raw === 'LOW STOCK') {
          data.cell.styles.textColor = [0, 0, 0];
          data.cell.styles.fillColor = [156, 225, 240];
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });
    doc.save('onlycaps-inventory-report.pdf');
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold uppercase text-black">Reports</h1>
      <p className="text-sm text-gray-500 mb-6">Export printable sales and inventory reports.</p>

      <div className="bg-white rounded-xl border-2 border-black p-6 mb-6">
        <h2 className="font-bold mb-4 text-black">Sales Report</h2>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">From</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border-2 border-black rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">To</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="border-2 border-black rounded-lg px-3 py-2 text-sm" />
          </div>
          <button onClick={generateSalesReport} disabled={generating} className="font-bold px-5 py-2 rounded-full text-sm" style={{ backgroundColor: CYAN, color: BLACK }}>
            {generating ? 'Generating...' : 'Export PDF'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border-2 border-black p-6">
        <h2 className="font-bold mb-4 text-black">Inventory Report</h2>
        <p className="text-sm text-gray-500 mb-4">Flags any product at or below 5 units in stock.</p>
        <button onClick={generateInventoryReport} disabled={generating} className="font-bold px-5 py-2 rounded-full text-sm" style={{ backgroundColor: CYAN, color: BLACK }}>
          {generating ? 'Generating...' : 'Export PDF'}
        </button>
      </div>
    </AdminLayout>
  );
}



