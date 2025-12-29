import { useState } from 'react'
import './App.css'
import { API_BASE_URL } from './config/api'
import {
  Dashboard,
  MenuDetail,
  OrderList,
  Order,
  Payment,
  QRPayment,
  PurchaseOrder,
  CashSuccess,
  Admin
} from './pages'

function App() {
  const [currentPage, setCurrentPage] = useState('home')
  const [selectedFood, setSelectedFood] = useState(null)
  const [activeTab, setActiveTab] = useState('dine-in')
  const [cartItems, setCartItems] = useState([])
  const [orderNote, setOrderNote] = useState('')
  const [selectedTable, setSelectedTable] = useState(null)
  const [customerInfo, setCustomerInfo] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
    dateOfBirth: '',
    tableNumber: '14'
  })
  const [cashOrderData, setCashOrderData] = useState(null)
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  const handleNavigate = (page, data = null) => {
    if (page === 'menu-detail' && data) {
      setSelectedFood(data)
    }
    if (page === 'cash-success' && data) {
      setCashOrderData(data)
    }
    setCurrentPage(page)
  }

  const handleAddToCart = (item) => {
    setCartItems(prev => [...prev, item])
  }

  const updateItemQuantity = (itemId, delta) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const newQty = Math.max(1, item.quantity + delta)
        return { ...item, quantity: newQty }
      }
      return item
    }))
  }

  const removeCartItem = (itemId) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId))
  }

  const handleCompleteOrder = async () => {
    try {
      const orderData = {
        customer_name: customerInfo.fullName || 'Guest',
        customer_email: customerInfo.email || null,
        customer_phone: customerInfo.phoneNumber || null,
        table_number: parseInt(customerInfo.tableNumber) || 14,
        order_type: 'dine-in',
        notes: orderNote || null,
        payment_status: 'cash',
        items: cartItems.map(item => ({
          menu_item_id: item.food.id,
          item_name: item.food.name,
          variant: item.option.name,
          quantity: item.quantity,
          price: item.option.price
        }))
      }

      const res = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })

      const data = await res.json()

      if (data.success) {
        clearCartAndReset()
        setCurrentPage('order-list')
      } else {
        console.error('Failed to save order:', data.message)
        alert('Gagal menyimpan pesanan. Silakan coba lagi.')
      }
    } catch (err) {
      console.error('Error saving order:', err)
      alert('Gagal terhubung ke server. Pastikan server berjalan.')
    }
  }

  const clearCartAndReset = () => {
    setCartItems([])
    setOrderNote('')
    setCustomerInfo({
      fullName: '',
      phoneNumber: '',
      email: '',
      dateOfBirth: '',
      tableNumber: '14'
    })
  }

  switch (currentPage) {
    case 'home':
      return (
        <Dashboard
          onNavigate={handleNavigate}
          cartCount={cartCount}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          selectedTable={selectedTable}
          setSelectedTable={(table) => {
            setSelectedTable(table)
            setCustomerInfo(prev => ({ ...prev, tableNumber: String(table) }))
          }}
        />
      )
    case 'menu-detail':
      return (
        <MenuDetail
          food={selectedFood}
          onNavigate={handleNavigate}
          onAddToCart={handleAddToCart}
        />
      )
    case 'order-list':
      return (
        <OrderList
          onNavigate={handleNavigate}
        />
      )
    case 'order':
      return (
        <Order
          onNavigate={handleNavigate}
          cartItems={cartItems}
          updateItemQuantity={updateItemQuantity}
          removeCartItem={removeCartItem}
          orderNote={orderNote}
          setOrderNote={setOrderNote}
          selectedTable={selectedTable}
          setSelectedTable={(table) => {
            setSelectedTable(table)
            setCustomerInfo(prev => ({ ...prev, tableNumber: String(table) }))
          }}
        />
      )
    case 'payment':
      return (
        <Payment
          onNavigate={handleNavigate}
          customerInfo={customerInfo}
          setCustomerInfo={setCustomerInfo}
          cartItems={cartItems}
          clearCartAndReset={clearCartAndReset}
        />
      )
    case 'qr-payment':
      return (
        <QRPayment
          onNavigate={handleNavigate}
          cartItems={cartItems}
        />
      )
    case 'purchase-order':
      return (
        <PurchaseOrder
          onNavigate={handleNavigate}
          cartItems={cartItems}
          customerInfo={customerInfo}
          setCustomerInfo={setCustomerInfo}
          orderNote={orderNote}
          onCompleteOrder={handleCompleteOrder}
        />
      )
    case 'cash-success':
      return (
        <CashSuccess
          onNavigate={handleNavigate}
          orderData={cashOrderData}
        />
      )
    case 'admin':
      return (
        <Admin
          onNavigate={handleNavigate}
        />
      )
    default:
      return (
        <Dashboard
          onNavigate={handleNavigate}
          cartCount={cartCount}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      )
  }
}

export default App
