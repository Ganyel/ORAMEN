function PurchaseOrder({ cartItems, customerInfo, orderNote, onCompleteOrder }) {

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID').format(price)
  }

  const getSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.option.price * item.quantity), 0)
  }

  const getTotal = () => {
    return getSubtotal()
  }

  return (
    <div className="app page-view">
      <header className="page-header">
        <div className="header-spacer"></div>
        <h1 className="page-title">Purchase Order</h1>
        <div className="header-spacer"></div>
      </header>

      <main className="page-content purchase-order-content">
        <div className="your-order-section">
          <h3>Your Order</h3>
          <div className="table-display">
            <span className="table-label">Table</span>
            <span className="table-number">{customerInfo.tableNumber}</span>
          </div>
        </div>

        {cartItems.map(item => (
          <div key={item.id} className="purchase-order-item">
            <div className="order-item-icon">
              <svg viewBox="0 0 24 24" fill="#1E3A5F" width="28" height="28">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
            </div>
            <div className="order-item-details">
              <h4>{item.food.name}</h4>
              <p className="order-item-variant">{item.option.name}</p>
            </div>
            <span className="order-qty">{item.quantity}</span>
          </div>
        ))}

        <div className="payment-summary-section">
          <h3>Payment Summary</h3>
          <div className="summary-row">
            <span>Price</span>
            <span>Rp {formatPrice(getSubtotal())}</span>
          </div>
          <div className="summary-row">
            <span>Discount</span>
            <span>Rp 0</span>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <span>Rp {formatPrice(getTotal())}</span>
          </div>
        </div>

        {orderNote && (
          <div className="note-section">
            <h3>Order Note</h3>
            <p>{orderNote}</p>
          </div>
        )}

        <div className="status-section">
          <h3>Checking Status Order</h3>
          <p>We're making sure the order details are correct.</p>
        </div>
      </main>

      <footer className="page-footer">
        <button className="primary-btn" onClick={onCompleteOrder}>Done</button>
      </footer>
    </div>
  )
}

export default PurchaseOrder
