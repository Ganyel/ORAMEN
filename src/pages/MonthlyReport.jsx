import { useState, useEffect } from 'react'

const API_BASE = 'http://localhost:5000/api/admin'

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

function MonthlyReport() {
  const [report, setReport] = useState([])
  const [year, setYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReport()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year])

  const fetchReport = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_BASE}/reports/monthly?year=${year}`)
      const data = await res.json()
      if (data.success) {
        setReport(data.data)
      }
    } catch (err) {
      console.error('Failed to fetch report:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const totals = report.reduce((acc, row) => ({
    orders: acc.orders + row.total_orders,
    revenue: acc.revenue + parseFloat(row.total_revenue),
    completed: acc.completed + row.completed_orders
  }), { orders: 0, revenue: 0, completed: 0 })

  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i)

  return (
    <div className="monthly-report">
      <div className="report-header">
        <h2>Laporan Bulanan</h2>
        <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="year-select">
          {yearOptions.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="loading">Memuat laporan...</div>
      ) : (
        <>
          <div className="summary-cards">
            <div className="summary-card">
              <span className="summary-value">{totals.orders}</span>
              <span className="summary-label">Total Pesanan</span>
            </div>
            <div className="summary-card">
              <span className="summary-value">{formatCurrency(totals.revenue)}</span>
              <span className="summary-label">Total Pendapatan</span>
            </div>
            <div className="summary-card">
              <span className="summary-value">{totals.completed}</span>
              <span className="summary-label">Pesanan Selesai</span>
            </div>
          </div>

          <div className="report-table-container">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Bulan</th>
                  <th>Total Pesanan</th>
                  <th>Pesanan Selesai</th>
                  <th>Total Pendapatan</th>
                </tr>
              </thead>
              <tbody>
                {report.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="no-data">Tidak ada data untuk tahun {year}</td>
                  </tr>
                ) : (
                  report.map((row) => (
                    <tr key={row.month}>
                      <td>{MONTH_NAMES[row.month - 1]}</td>
                      <td>{row.total_orders}</td>
                      <td>{row.completed_orders}</td>
                      <td>{formatCurrency(row.total_revenue)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              {report.length > 0 && (
                <tfoot>
                  <tr>
                    <td><strong>Total</strong></td>
                    <td><strong>{totals.orders}</strong></td>
                    <td><strong>{totals.completed}</strong></td>
                    <td><strong>{formatCurrency(totals.revenue)}</strong></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </>
      )}

      <style>{`
        .monthly-report {
          padding: 16px;
        }
        .report-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .report-header h2 {
          margin: 0;
          font-size: 20px;
          color: var(--text-dark);
        }
        .year-select {
          padding: 10px 16px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 14px;
          background: white;
          cursor: pointer;
        }
        .summary-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }
        .summary-card {
          background: white;
          border-radius: 12px;
          padding: 16px;
          text-align: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .summary-value {
          display: block;
          font-size: 18px;
          font-weight: 700;
          color: var(--primary-blue);
          margin-bottom: 4px;
        }
        .summary-label {
          font-size: 12px;
          color: var(--text-gray);
        }
        .report-table-container {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .report-table {
          width: 100%;
          border-collapse: collapse;
        }
        .report-table th,
        .report-table td {
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }
        .report-table th {
          background: #f8f9fa;
          font-weight: 600;
          font-size: 13px;
          color: var(--text-dark);
        }
        .report-table td {
          font-size: 14px;
        }
        .report-table tfoot td {
          background: #f8f9fa;
          border-top: 2px solid #ddd;
        }
        .no-data {
          text-align: center;
          color: var(--text-gray);
          padding: 40px !important;
        }
        .loading {
          text-align: center;
          padding: 40px;
          color: var(--text-gray);
        }
        @media (max-width: 600px) {
          .summary-cards {
            grid-template-columns: 1fr;
          }
          .report-table th,
          .report-table td {
            padding: 10px 12px;
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  )
}

export default MonthlyReport
