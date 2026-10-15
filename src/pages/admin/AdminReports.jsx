import { useState, useRef } from 'react';
import AdminLayout from '../../components/AdminLayout';
import supabase from '../../utils/supabase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Preset date ranges for quick selection
const DATE_PRESETS = [
  { key: 'today', label: 'Today', days: 0 },
  { key: 'yesterday', label: 'Yesterday', days: 1, offset: 1 },
  { key: 'last7', label: 'Last 7 Days', days: 6 },
  { key: 'last30', label: 'Last 30 Days', days: 29 },
  { key: 'thisMonth', label: 'This Month', type: 'month' },
  { key: 'lastMonth', label: 'Last Month', type: 'lastMonth' },
  { key: 'thisQuarter', label: 'This Quarter', type: 'quarter' },
  { key: 'thisYear', label: 'This Year', type: 'year' },
  { key: 'custom', label: 'Custom Range', type: 'custom' },
];

export default function AdminReports() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [generating, setGenerating] = useState(false);
  const [activePreset, setActivePreset] = useState('last30');
  const [showCustom, setShowCustom] = useState(false);
  const dateFromRef = useRef(null);
  const dateToRef = useRef(null);

  // Handle preset selection
  const handlePresetChange = (preset) => {
    setActivePreset(preset.key);
    setShowCustom(preset.key === 'custom');
    
    if (preset.type === 'custom') {
      return; // Let user pick custom dates
    }

    const now = new Date();
    let from, to;

    if (preset.type === 'month') {
      // This month
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    } else if (preset.type === 'lastMonth') {
      // Last month
      from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    } else if (preset.type === 'quarter') {
      // This quarter
      const quarterStart = Math.floor(now.getMonth() / 3) * 3;
      from = new Date(now.getFullYear(), quarterStart, 1);
      to = new Date(now.getFullYear(), quarterStart + 3, 0, 23, 59, 59);
    } else if (preset.type === 'year') {
      // This year
      from = new Date(now.getFullYear(), 0, 1);
      to = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
    } else {
      // Day-based presets
      to = new Date(now);
      to.setHours(23, 59, 59, 999);
      
      if (preset.offset) {
        // Yesterday
        from = new Date(now);
        from.setDate(from.getDate() - preset.offset);
        from.setHours(0, 0, 0, 0);
        to = new Date(from);
        to.setHours(23, 59, 59, 999);
      } else {
        // Today, Last 7, Last 30
        from = new Date(now);
        from.setDate(from.getDate() - preset.days);
        from.setHours(0, 0, 0, 0);
      }
    }

    setDateFrom(from.toISOString().split('T')[0]);
    setDateTo(to.toISOString().split('T')[0]);
  };

  // Initialize with default preset
  const initializeDefault = () => {
    const preset = DATE_PRESETS.find(p => p.key === 'last30');
    handlePresetChange(preset);
  };

  const generateSalesReport = async () => {
    setGenerating(true);
    let query = supabase.from('orders').select('id, total, status, created_at').order('created_at', { ascending: true });
    if (dateFrom) query = query.gte('created_at', dateFrom);
    if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59.999Z');
    const { data, error } = await query;
    setGenerating(false);
    if (error) return alert(error.message);

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('OnlyCaps - Sales Report', 14, 18);
    doc.setFontSize(10);
    const rangeText = dateFrom && dateTo 
      ? `${new Date(dateFrom).toLocaleDateString()} to ${new Date(dateTo).toLocaleDateString()}`
      : 'All time';
    doc.text(`Range: ${rangeText}`, 14, 25);

    const rows = (data || []).map(o => [o.id, o.status, new Date(o.created_at).toLocaleDateString(), `₱${o.total}`]);
    const totalRevenue = (data || []).reduce((sum, o) => sum + (o.total || 0), 0);

    autoTable(doc, { startY: 32, head: [['Order ID', 'Status', 'Date', 'Total']], body: rows });

    const finalY = doc.lastAutoTable.finalY || 32;
    doc.setFontSize(12);
    doc.text(`Total Revenue: ₱${totalRevenue.toLocaleString()}`, 14, finalY + 10);
    doc.save(`onlycaps-sales-report-${dateFrom || 'all'}-to-${dateTo || 'present'}.pdf`);
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
      <h1 className="text-2xl font-bold text-base-content">Reports</h1>
      <p className="text-sm text-base-content/60 mb-6">Export printable sales and inventory reports.</p>

      {/* Sales Report */}
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-base-content">Sales Report</h2>
          <span className="badge badge-info text-xs">
            {DATE_PRESETS.find(p => p.key === activePreset)?.label || 'Custom Range'}
          </span>
        </div>

        {/* Preset Buttons */}
        <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="Quick date presets">
          {DATE_PRESETS.map(preset => (
            <button
              key={preset.key}
              type="button"
              onClick={() => handlePresetChange(preset)}
              className={`btn btn-sm ${activePreset === preset.key ? 'btn-primary' : 'btn-outline'}`}
              aria-pressed={activePreset === preset.key}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Custom Date Inputs (shown when "Custom Range" is selected) */}
        {(activePreset === 'custom' || showCustom) && (
          <div className="flex flex-wrap items-end gap-3">
            <div className="relative">
              <label className="label">From Date</label>
              <div className="relative">
                <input
                  type="date"
                  id="dateFrom"
                  ref={dateFromRef}
                  value={dateFrom}
                  onChange={e => { setDateFrom(e.target.value); setShowCustom(true); setActivePreset('custom'); }}
                  className="input pr-12"
                  max={new Date().toISOString().split('T')[0]}
                />
                <button
                  type="button"
                  onClick={() => dateFromRef.current?.showPicker?.()}
                  className="absolute right-3 top-full mt-1.5 -translate-y-full text-base-content/50 hover:text-primary transition-colors"
                  aria-label="Open calendar for From Date"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="relative">
              <label className="label">To Date</label>
              <div className="relative">
                <input
                  type="date"
                  id="dateTo"
                  ref={dateToRef}
                  value={dateTo}
                  onChange={e => { setDateTo(e.target.value); setShowCustom(true); setActivePreset('custom'); }}
                  className="input pr-12"
                  max={new Date().toISOString().split('T')[0]}
                />
                <button
                  type="button"
                  onClick={() => dateToRef.current?.showPicker?.()}
                  className="absolute right-3 top-full mt-1.5 -translate-y-full text-base-content/50 hover:text-primary transition-colors"
                  aria-label="Open calendar for To Date"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
            {dateFrom && dateTo && (
              <div className="text-sm text-base-content/60 self-end mb-2">
                {Math.ceil((new Date(dateTo) - new Date(dateFrom)) / (1000 * 60 * 60 * 24)) + 1} days selected
              </div>
            )}
          </div>
        )}

        <div className="divider my-4" />

        <button
          onClick={generateSalesReport}
          disabled={generating}
          className="btn btn-primary btn-lg"
        >
          {generating ? 'Generating...' : 'Export Sales Report (PDF)'}
        </button>
      </div>

      {/* Inventory Report */}
      <div className="card p-6">
        <h2 className="font-semibold text-base-content mb-4">Inventory Report</h2>
        <p className="text-sm text-base-content/60 mb-4">Flags any product at or below 5 units in stock.</p>
        <button
          onClick={generateInventoryReport}
          disabled={generating}
          className="btn btn-primary btn-lg"
        >
          {generating ? 'Generating...' : 'Export Inventory Report (PDF)'}
        </button>
      </div>
    </AdminLayout>
  );
}