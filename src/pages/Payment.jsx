import { useState, useEffect } from 'react'
import { createTransaction, openSnapPopup } from '../services/midtransService'
import { useOrderContext } from '../context/OrderContext'
import OrderContextHeader from '../components/OrderContextHeader'
import { API_BASE_URL } from '../config/api'

function Payment({ onNavigate, customerInfo, setCustomerInfo, cartItems, clearCartAndReset }) {
  const { orderType, tableNumber, isOrderConfigured } = useOrderContext()
  const [paymentStep, setPaymentStep] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState('qris')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

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

  const buildOrderItems = () => {
    return cartItems.map(item => ({
      menu_item_id: item.menu_item_id,
      item_name: item.name,
      variant: item.variants && item.variants.length > 0 
        ? item.variants.map(v => v.option).join(', ') 
        : null,
      quantity: item.quantity,
      price: item.price
    }))
  }

  // ============ CASH PAYMENT ============
  // NO Midtrans, NO snap.pay, direct to database only
  const handleCashPayment = async () => {
    // Validation
    if (cartItems.length === 0) {
      alert('Cart is empty')
      return
    }
    if (getTotal() <= 0) {
      setError('Invalid total amount')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const orderPayload = {
        customer_name: customerInfo.fullName || 'Guest',
        customer_email: customerInfo.email || null,
        customer_phone: customerInfo.phoneNumber || null,
        table_number: parseInt(customerInfo.tableNumber) || 14,
        order_type: 'dine-in',
        notes: null,
        payment_status: 'cash',
        items: buildOrderItems()
      }

      const res = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.message || 'Failed to create order')
      }

      // Prepare order data for confirmation page
      const cashOrderData = {
        orderNumber: data.data.order_number,
        tableNumber: customerInfo.tableNumber,
        total: getTotal()
      }

      // Order created successfully - clear cart and navigate to cash confirmation
      clearCartAndReset()
      onNavigate('cash-success', cashOrderData)
    } catch (err) {
      console.error('Cash payment failed:', err)
      setError(err.message || 'Failed to create order. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // ============ QRIS PAYMENT ============
  // Uses Midtrans Snap, QR code appears from Snap popup
  const handleQrisPayment = async () => {
    // Validation
    if (!window.snap || typeof window.snap.pay !== 'function') {
      setError('Payment system not ready, please wait')
      return
    }
    if (cartItems.length === 0) {
      setError('Cart is empty')
      return
    }
    if (getTotal() <= 0) {
      setError('Invalid total amount')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Step 1: Create order in database with 'pending' status
      const orderData = {
        customer_name: customerInfo.fullName || 'Guest',
        customer_email: customerInfo.email || null,
        customer_phone: customerInfo.phoneNumber || null,
        table_number: parseInt(customerInfo.tableNumber) || 14,
        order_type: 'dine-in',
        notes: null,
        payment_status: 'pending',
        items: buildOrderItems()
      }

      const orderRes = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })

      const orderResult = await orderRes.json()

      if (!orderResult.success) {
        throw new Error(orderResult.message || 'Failed to create order')
      }

      const orderId = orderResult.data.order_number

      // Step 2: Create Midtrans transaction token
      const itemDetails = cartItems.map(item => ({
        id: `ITEM-${item.menu_item_id}`,
        price: item.price,
        quantity: item.quantity,
        name: item.variants && item.variants.length > 0 
          ? `${item.name} (${item.variants.map(v => v.option).join(', ')})`
          : item.name
      }))

      itemDetails.push({
        id: 'TAX',
        price: getTax(),
        quantity: 1,
        name: 'Tax 3%'
      })

      const transactionData = {
        orderId,
        grossAmount: getTotal(),
        customerDetails: {
          firstName: customerInfo.fullName || 'Guest',
          email: customerInfo.email || 'guest@oramen.com',
          phone: customerInfo.phoneNumber || ''
        },
        itemDetails,
        paymentMethod: 'qris'
      }

      const { token } = await createTransaction(transactionData)

      // Step 3: Open Midtrans Snap popup - QR code appears here
      const result = await openSnapPopup(token, {
        onSuccess: (res) => console.log('Payment successful:', res),
        onPending: (res) => console.log('Payment pending:', res),
        onError: (res) => console.log('Payment error:', res),
        onClose: () => console.log('Payment popup closed')
      })

      // Step 4: Handle result based on Snap response
      if (result.status === 'success') {
        // Payment completed - clear cart and go to order list
        clearCartAndReset()
        onNavigate('order-list')
      } else if (result.status === 'pending') {
        // Payment pending (e.g., waiting for QRIS scan) - go to order list
        // Webhook will update status when payment completes
        clearCartAndReset()
        onNavigate('order-list')
      }
      // If closed without payment, do nothing - keep cart intact
    } catch (err) {
      console.error('QRIS payment failed:', err)
      setError(err.message || 'Payment failed. Please try again.')
      // Keep cart intact on error so user can retry
    } finally {
      setIsLoading(false)
    }
  }

  // ============ MAIN HANDLER ============
  // Routes to correct payment function based on selected method
  const handlePayment = () => {
    if (paymentMethod === 'cash') {
      handleCashPayment()
    } else if (paymentMethod === 'qris') {
      handleQrisPayment()
    }
  }

  return (
    <div className="app page-view">
      <header className="page-header">
        <button className="back-btn" onClick={() => paymentStep === 1 ? onNavigate('order') : setPaymentStep(1)}>‹</button>
        <h1 className="page-title">Payment</h1>
        <div className="header-spacer"></div>
      </header>

      <div className="page-tabs">
        <OrderContextHeader mode="readonly" />
      </div>

      <main className="page-content payment-form">
        <h2 className="form-section-title">Customer Information</h2>
        
        <div className="form-group">
          <label>Full Name*</label>
          <input 
            type="text" 
            placeholder="Full Name"
            value={customerInfo.fullName}
            onChange={e => setCustomerInfo({...customerInfo, fullName: e.target.value})}
          />
        </div>

        <div className="form-group">
          <label>Phone Number*</label>
          <input 
            type="tel" 
            placeholder="Phone Number"
            value={customerInfo.phoneNumber}
            onChange={e => setCustomerInfo({...customerInfo, phoneNumber: e.target.value})}
          />
        </div>

        <div className="form-group">
          <label>Send Receipt to Email</label>
          <input 
            type="email" 
            placeholder="Email"
            value={customerInfo.email}
            onChange={e => setCustomerInfo({...customerInfo, email: e.target.value})}
          />
        </div>

        {paymentStep === 1 && (
          <>
            <div className="form-group">
              <label>Date of Birth</label>
              <input 
                type="text" 
                placeholder="dd/mm/yyyy"
                value={customerInfo.dateOfBirth}
                onChange={e => setCustomerInfo({...customerInfo, dateOfBirth: e.target.value})}
              />
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
          </>
        )}

        {paymentStep === 2 && (
          <>
            <h2 className="form-section-title" style={{marginTop: '24px'}}>Option</h2>
            
            <div className="payment-method-section">
              <h3>E-Wallet</h3>
              <div 
                className={`payment-method-option ${paymentMethod === 'qris' ? 'selected' : ''}`}
                onClick={() => setPaymentMethod('qris')}
              >
                <div className="method-radio"></div>
                <span className="qris-label">QRIS</span>
              </div>
            </div>

            <div className="payment-method-section">
              <h3>Bayar Tunai</h3>
              <div 
                className={`payment-method-option ${paymentMethod === 'cash' ? 'selected' : ''}`}
                onClick={() => setPaymentMethod('cash')}
              >
                <div className="method-radio"></div>
                <span>Cash</span>
              </div>
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
          </>
        )}
      </main>

      <footer className="page-footer">
        <div className="footer-total">
          <span>Payment Total</span>
          <span className="footer-price">Rp {formatPrice(getTotal())}</span>
        </div>
        {paymentStep === 1 ? (
          <button 
            className="primary-btn" 
            onClick={() => {
              if (!customerInfo.fullName || !customerInfo.fullName.trim()) {
                setError('Full Name is required')
                return
              }
              if (!customerInfo.phoneNumber || !customerInfo.phoneNumber.trim()) {
                setError('Phone Number is required')
                return
              }
              setError(null)
              setPaymentStep(2)
            }}
          >
            Next
          </button>
        ) : (
          <button 
            className="primary-btn" 
            onClick={handlePayment}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Payment'}
          </button>
        )}
      </footer>

    </div>
  )
}

export default Payment
