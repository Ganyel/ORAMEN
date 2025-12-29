import { useState, useEffect, useRef } from 'react'
import { useOrderContext } from '../context/OrderContext'
import OrderContextHeader from '../components/OrderContextHeader'

function Order({ onNavigate, cartItems, updateItemQuantity, removeCartItem, orderNote, setOrderNote }) {
  const { orderType, tableNumber, isOrderConfigured } = useOrderContext()
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [swipedItemId, setSwipedItemId] = useState(null)
  const touchStartX = useRef(0)
  const touchCurrentX = useRef(0)

  // Guard: redirect to dashboard if order not configured
  useEffect(() => {
    if (!isOrderConfigured()) {
      onNavigate('home')
    }
  }, [orderType, tableNumber, isOrderConfigured, onNavigate])

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID').format(price)
  }

  const getSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }

  const getTax = () => {
    return Math.round(getSubtotal() * 0.03)
  }

  const getTotal = () => {
    return getSubtotal() + getTax()
  }

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
    touchCurrentX.current = e.touches[0].clientX
  }

  const handleTouchMove = (e) => {
    touchCurrentX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e, itemId) => {
    const diff = touchStartX.current - touchCurrentX.current
    if (diff > 50) {
      setSwipedItemId(itemId)
    } else if (diff < -50) {
      setSwipedItemId(null)
    }
  }

  return (
    <div className="app page-view">
      <header className="page-header">
        <button className="back-btn" onClick={() => onNavigate('home')}>‹</button>
        <h1 className="page-title">Order</h1>
        <div className="header-spacer"></div>
      </header>

      <div className="page-tabs">
        <OrderContextHeader mode="readonly" />
      </div>

      <main className="page-content">
        <div className="order-section">
          <div className="order-section-header">
            <span>Ordered Detail ({cartItems.length})</span>
            <button className="edit-btn" onClick={() => onNavigate('home')}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
              Tambah Menu
            </button>
          </div>

          {cartItems.map(item => (
            <div 
              key={item.id} 
              className={`order-item-wrapper ${swipedItemId === item.id ? 'swiped' : ''}`}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={(e) => handleTouchEnd(e, item.id)}
            >
              <div className="order-item">
                <div className="order-item-image">
                  <img 
                    src={item.image_url} 
                    alt={item.name}
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/60x60?text=No+Image' }}
                  />
                </div>
                <div className="order-item-details">
                  <h4>{item.name}</h4>
                  {item.variants && item.variants.length > 0 ? (
                    <p className="order-item-variant">
                      {item.variants.map(v => v.option).join(', ')}
                    </p>
                  ) : null}
                  <p className="order-item-price">Rp {formatPrice(item.price)}</p>
                </div>
                <div className="order-item-actions">
                  <div className="order-item-quantity">
                    <button onClick={() => updateItemQuantity(item.id, -1)}>−</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateItemQuantity(item.id, 1)}>+</button>
                  </div>
                </div>
              </div>
              <div className="swipe-actions">
                <button 
                  className="delete-action-btn" 
                  onClick={() => { removeCartItem && removeCartItem(item.id); setSwipedItemId(null); }}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}

          <button className="add-note-btn" onClick={() => setShowNoteModal(true)}>
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
              <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
            </svg>
            {orderNote ? 'Edit Note' : 'Add Note'}
          </button>
          {orderNote && (
            <div className="order-note-display">
              <span className="note-label">Note:</span>
              <p className="note-text">{orderNote}</p>
            </div>
          )}
        </div>

        <div className="payment-detail-section">
          <h3>Payment Detail</h3>
          <div className="payment-row">
            <span>Subtotal</span>
            <span>Rp {formatPrice(getSubtotal())}</span>
          </div>
          <div className="payment-row">
            <span>Tax 3%</span>
            <span>Rp {formatPrice(getTax())}</span>
          </div>
          <div className="payment-row total">
            <span>Total Amount</span>
            <span>Rp {formatPrice(getTotal())}</span>
          </div>
        </div>
      </main>

      <footer className="page-footer">
        <div className="footer-total">
          <span>Payment Total</span>
          <span className="footer-price">Rp {formatPrice(getTotal())}</span>
        </div>
        <button className="primary-btn" onClick={() => onNavigate('payment')}>
          Continue to Payment
        </button>
      </footer>

      {showNoteModal && (
        <div className="modal-overlay" onClick={() => setShowNoteModal(false)}>
          <div className="note-modal" onClick={e => e.stopPropagation()}>
            <div className="note-modal-header">
              <h3>Add Note</h3>
              <button className="close-note-btn" onClick={() => setShowNoteModal(false)}>×</button>
            </div>
            <div className="note-modal-content">
              <textarea
                placeholder="Add special instructions for your order (e.g., no onions, extra spicy, allergies...)"
                value={orderNote}
                onChange={e => setOrderNote(e.target.value)}
                rows={4}
              />
            </div>
            <div className="note-modal-footer">
              <button className="secondary-btn" onClick={() => { setOrderNote(''); setShowNoteModal(false); }}>
                Clear
              </button>
              <button className="primary-btn" onClick={() => setShowNoteModal(false)}>
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default Order
