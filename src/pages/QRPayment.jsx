import { useState, useEffect } from 'react'

function QRPayment({ onNavigate, cartItems }) {
  const [countdown, setCountdown] = useState({ minutes: 0, seconds: 20, milliseconds: 45 })

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID').format(price)
  }

  const getSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.option.price * item.quantity), 0)
  }

  const getTax = () => {
    return Math.round(getSubtotal() * 0.03)
  }

  const getTotal = () => {
    return getSubtotal() + getTax()
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        let { minutes, seconds, milliseconds } = prev
        milliseconds -= 1
        if (milliseconds < 0) {
          milliseconds = 99
          seconds -= 1
        }
        if (seconds < 0) {
          seconds = 59
          minutes -= 1
        }
        if (minutes < 0) {
          clearInterval(timer)
          return { minutes: 0, seconds: 0, milliseconds: 0 }
        }
        return { minutes, seconds, milliseconds }
      })
    }, 10)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="app page-view">
      <header className="page-header">
        <button className="back-btn" onClick={() => onNavigate('payment')}>‹</button>
        <h1 className="page-title">Payment</h1>
        <div className="header-spacer"></div>
      </header>

      <div className="tabs page-tabs">
        <button className="tab active">Dine In</button>
        <button className="tab">Table 14</button>
      </div>

      <main className="page-content qr-payment-content">
        <p className="qr-instruction">Complete payment in</p>
        
        <div className="qr-code-container">
          <div className="qr-code">
            <svg viewBox="0 0 100 100" width="150" height="150">
              <rect x="0" y="0" width="100" height="100" fill="white"/>
              <rect x="10" y="10" width="25" height="25" fill="black"/>
              <rect x="65" y="10" width="25" height="25" fill="black"/>
              <rect x="10" y="65" width="25" height="25" fill="black"/>
              <rect x="15" y="15" width="15" height="15" fill="white"/>
              <rect x="70" y="15" width="15" height="15" fill="white"/>
              <rect x="15" y="70" width="15" height="15" fill="white"/>
              <rect x="18" y="18" width="9" height="9" fill="black"/>
              <rect x="73" y="18" width="9" height="9" fill="black"/>
              <rect x="18" y="73" width="9" height="9" fill="black"/>
              <rect x="40" y="10" width="5" height="5" fill="black"/>
              <rect x="50" y="10" width="5" height="5" fill="black"/>
              <rect x="40" y="20" width="5" height="5" fill="black"/>
              <rect x="45" y="25" width="5" height="5" fill="black"/>
              <rect x="40" y="40" width="20" height="20" fill="black"/>
              <rect x="45" y="45" width="10" height="10" fill="white"/>
              <rect x="10" y="45" width="5" height="5" fill="black"/>
              <rect x="20" y="40" width="5" height="5" fill="black"/>
              <rect x="25" y="50" width="5" height="5" fill="black"/>
              <rect x="65" y="40" width="5" height="5" fill="black"/>
              <rect x="75" y="45" width="5" height="5" fill="black"/>
              <rect x="80" y="55" width="5" height="5" fill="black"/>
              <rect x="45" y="65" width="5" height="5" fill="black"/>
              <rect x="55" y="70" width="5" height="5" fill="black"/>
              <rect x="65" y="65" width="10" height="10" fill="black"/>
              <rect x="80" y="70" width="10" height="10" fill="black"/>
              <rect x="70" y="80" width="5" height="5" fill="black"/>
            </svg>
          </div>
        </div>

        <div className="countdown-timer">
          <span className="time-unit">{String(countdown.minutes).padStart(2, '0')}</span>
          <span className="time-separator">:</span>
          <span className="time-unit">{String(countdown.seconds).padStart(2, '0')}</span>
          <span className="time-separator">:</span>
          <span className="time-unit">{String(countdown.milliseconds).padStart(2, '0')}</span>
        </div>

        <div className="qr-instructions">
          <h4>Tata cara pembayaran</h4>
          <ol>
            <li>Buka pembayaran QR di m-banking atau e-wallet Anda</li>
            <li>Arahkan gambar/tangkap layar kode QR</li>
            <li>Periksa kembali total dan detailnya pembayaran</li>
            <li>Klik Periksa Status Pembayaran</li>
          </ol>
        </div>

        <div className="total-payment-display">
          <span className="total-amount">Rp {formatPrice(getTotal())}</span>
          <span className="total-label">Payment Total</span>
        </div>
      </main>

      <footer className="page-footer">
        <button className="primary-btn" onClick={() => onNavigate('purchase-order')}>
          Check Payment Status
        </button>
      </footer>
    </div>
  )
}

export default QRPayment
