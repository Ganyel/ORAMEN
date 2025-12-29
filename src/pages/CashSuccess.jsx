function CashSuccess({ onNavigate, orderData }) {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID').format(price)
  }

  return (
    <div className="app page-view">
      <header className="page-header">
        <div className="header-spacer"></div>
        <h1 className="page-title">Order Confirmed</h1>
        <div className="header-spacer"></div>
      </header>

      <main className="page-content" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        textAlign: 'center',
        padding: '24px 16px'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: '#4CAF50',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px'
        }}>
          <svg viewBox="0 0 24 24" fill="white" width="48" height="48">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
        </div>

        <h2 style={{ 
          fontSize: '18px', 
          color: '#1E3A5F', 
          marginBottom: '8px',
          fontWeight: '600'
        }}>
          Pesanan Berhasil Dibuat
        </h2>

        <p style={{ 
          fontSize: '14px', 
          color: '#666', 
          marginBottom: '32px' 
        }}>
          Pembayaran: Cash
        </p>

        <div style={{
          background: '#F5F5F5',
          borderRadius: '12px',
          padding: '24px',
          width: '100%',
          maxWidth: '300px',
          marginBottom: '24px'
        }}>
          <p style={{ 
            fontSize: '14px', 
            color: '#666', 
            marginBottom: '8px' 
          }}>
            Kode Pesanan
          </p>
          <p style={{ 
            fontSize: '32px', 
            fontWeight: 'bold', 
            color: '#1E3A5F',
            marginBottom: '16px',
            letterSpacing: '2px'
          }}>
            {orderData?.orderNumber || '#0000'}
          </p>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            borderTop: '1px solid #ddd',
            paddingTop: '16px',
            marginTop: '8px'
          }}>
            <div>
              <p style={{ fontSize: '12px', color: '#666' }}>Table</p>
              <p style={{ fontSize: '16px', fontWeight: '600', color: '#1E3A5F' }}>
                {orderData?.tableNumber || '-'}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '12px', color: '#666' }}>Total</p>
              <p style={{ fontSize: '16px', fontWeight: '600', color: '#1E3A5F' }}>
                Rp {formatPrice(orderData?.total || 0)}
              </p>
            </div>
          </div>
        </div>

        <p style={{ 
          fontSize: '14px', 
          color: '#666',
          lineHeight: '1.6',
          maxWidth: '280px'
        }}>
          Silakan tunjukkan kode ini ke kasir untuk melakukan pembayaran
        </p>
      </main>

      <footer className="page-footer">
        <button 
          className="primary-btn" 
          onClick={() => onNavigate('order-list')}
        >
          Lihat Pesanan
        </button>
      </footer>
    </div>
  )
}

export default CashSuccess
