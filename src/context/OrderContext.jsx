import { createContext, useContext, useState, useEffect } from 'react'

const OrderContext = createContext()

export function OrderProvider({ children }) {
  const [orderType, setOrderType] = useState(null) // null = not yet selected
  const [tableNumber, setTableNumber] = useState(null)
  const [showTableModal, setShowTableModal] = useState(false)
  const [isQrScanned, setIsQrScanned] = useState(false) // Lock UI when QR scanned

  // Detect table number from URL param on mount (QR scan)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tableParam = params.get('table')
    if (tableParam) {
      const tableNum = parseInt(tableParam, 10)
      if (!isNaN(tableNum) && tableNum > 0) {
        setTableNumber(tableNum)
        setOrderType('dine-in')
        setIsQrScanned(true)
        // Clean URL after reading param
        window.history.replaceState({}, '', window.location.pathname)
      }
    }
  }, [])

  const handleSetOrderType = (type) => {
    if (isQrScanned) return // Locked when QR scanned
    setOrderType(type)
    if (type === 'take-away') {
      setTableNumber(null)
    }
  }

  const handleSetTableNumber = (num) => {
    if (isQrScanned) return // Locked when QR scanned
    setTableNumber(num)
    setShowTableModal(false)
  }

  // Check if order is properly configured
  const isOrderConfigured = () => {
    if (!orderType) return false
    if (orderType === 'dine-in' && !tableNumber) return false
    return true
  }

  const value = {
    orderType,
    setOrderType: handleSetOrderType,
    tableNumber,
    setTableNumber: handleSetTableNumber,
    showTableModal,
    setShowTableModal,
    isOrderConfigured,
    isQrScanned
  }

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  )
}

export function useOrderContext() {
  const context = useContext(OrderContext)
  if (!context) {
    throw new Error('useOrderContext must be used within OrderProvider')
  }
  return context
}

export default OrderContext
