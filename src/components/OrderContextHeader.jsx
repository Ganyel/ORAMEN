import { useOrderContext } from '../context/OrderContext'

function OrderContextHeader({ onTableClick, showTableSelector = true, mode = 'editable' }) {
  const { orderType, setOrderType, tableNumber, isQrScanned } = useOrderContext()

  const isReadonly = mode === 'readonly' || isQrScanned

  return (
    <div className="order-context-header">
      <div className="order-type-tabs">
        <button 
          className={`order-type-btn ${orderType === 'dine-in' ? 'active' : ''} ${isReadonly ? 'readonly' : ''}`}
          onClick={() => !isReadonly && setOrderType('dine-in')}
          disabled={isReadonly}
        >
          Dine In {isQrScanned && orderType === 'dine-in' ? '(QR)' : ''}
        </button>
        <button 
          className={`order-type-btn ${orderType === 'take-away' ? 'active' : ''} ${isReadonly ? 'readonly' : ''}`}
          onClick={() => !isReadonly && setOrderType('take-away')}
          disabled={isReadonly}
        >
          Take Away
        </button>
      </div>
      {orderType === 'dine-in' && showTableSelector && (
        <button 
          className={`table-selector-btn ${isReadonly ? 'readonly' : ''}`}
          onClick={() => !isReadonly && onTableClick && onTableClick()}
          disabled={isReadonly}
        >
          Table {tableNumber || '-'} {isQrScanned ? '(Locked)' : ''}
        </button>
      )}
    </div>
  )
}

export default OrderContextHeader
