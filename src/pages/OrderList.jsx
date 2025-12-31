import { useState, useEffect } from 'react'
import { useOrderContext } from '../context/OrderContext'
import OrderContextHeader from '../components/OrderContextHeader'
import { API_ADMIN_URL, API_BASE_URL } from '../config/api'

function OrderList({ onNavigate }) {
  const { orderType } = useOrderContext()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [ratingOrder, setRatingOrder] = useState(null)
  const [ratingItems, setRatingItems] = useState([])
  const [submittingRating, setSubmittingRating] = useState(false)
  const [ratingComment, setRatingComment] = useState('')

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_ADMIN_URL}/orders?limit=50`)
      const data = await res.json()
      if (data.success) {
        setOrders(data.data.map(order => ({
          id: order.id,
          orderNumber: order.order_number,
          customerName: order.customer_name,
          tableNumber: order.table_number,
          itemCount: order.item_count || 0,
          itemDetails: order.item_details || '',
          status: order.status,
          type: order.order_type || 'dine-in'
        })))
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = orders.filter(order => order.type === orderType)

  const handleRateOrder = async (order) => {
    try {
      const res = await fetch(`${API_ADMIN_URL}/orders/${order.id}`)
      const data = await res.json()
      if (data.success && data.data.items) {
        setRatingOrder(order)
        setRatingItems(data.data.items.map(item => ({ ...item, rating: 0 })))
        setShowRatingModal(true)
      }
    } catch (err) {
      console.error('Failed to fetch order items:', err)
    }
  }

  const submitRatings = async () => {
    setSubmittingRating(true)
    try {
      for (const item of ratingItems) {
        if (item.rating > 0 && item.menu_item_id) {
          await fetch(`${API_BASE_URL}/menu/${item.menu_item_id}/rating`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              rating: item.rating, 
              order_id: ratingOrder.id,
              comment: ratingComment || null
            })
          })
        }
      }
      setShowRatingModal(false)
      setRatingOrder(null)
      setRatingItems([])
      setRatingComment('')
    } catch (err) {
      console.error('Failed to submit ratings:', err)
    } finally {
      setSubmittingRating(false)
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'sedang-dibuat': return 'Sedang dibuat'
      case 'menunggu': return 'Menunggu'
      case 'siap': return 'Siap'
      case 'selesai': return 'Selesai'
      default: return status
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'sedang-dibuat': return 'status-blue'
      case 'menunggu': return 'status-orange'
      case 'siap': return 'status-green'
      case 'selesai': return 'status-green'
      default: return 'status-blue'
    }
  }

  const getTableColor = (tableNumber) => {
    const num = parseInt(tableNumber)
    if (num === 1 || num === 4) return 'table-blue'
    if (num === 2 || num === 14 || num === 5) return 'table-green'
    if (num === 3) return 'table-orange'
    if (num === 6) return 'table-blue'
    return 'table-blue'
  }

  return (
    <div className="app page-view">
      <header className="page-header">
        <button className="back-btn" onClick={() => onNavigate('home')}>‹</button>
        <h1 className="page-title">Order List</h1>
        <div className="header-spacer"></div>
      </header>

      <div className="page-tabs">
        <OrderContextHeader mode="readonly" showTableSelector={false} />
      </div>

      <main className="page-content order-list-content">
        {loading ? (
          <div className="loading-state">Memuat pesanan...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="empty-state">Belum ada pesanan</div>
        ) : filteredOrders.map(order => (
          <div key={order.id} className="order-list-card">
            <div className={`order-table-badge ${getTableColor(order.tableNumber)}`}>
              Table {order.tableNumber}
            </div>
            <div className="order-list-info">
              <h4 className="order-customer-name">{order.customerName}</h4>
              <p className="order-item-count">{order.itemCount} Items</p>
              {order.itemDetails && (
                <p className="order-item-details">{order.itemDetails}</p>
              )}
            </div>
            <div className="order-list-status">
              <span className="order-number">{order.orderNumber}</span>
              <span className={`order-status-badge ${getStatusColor(order.status)}`}>
                {getStatusLabel(order.status)}
              </span>
              {order.status === 'selesai' && (
                <button
                  className="rate-order-btn"
                  onClick={(e) => { e.stopPropagation(); handleRateOrder(order); }}
                >
                  Beri Rating
                </button>
              )}
            </div>
          </div>
        ))}
      </main>

      {showRatingModal && (
        <div className="modal-overlay" onClick={() => setShowRatingModal(false)}>
          <div className="rating-modal" onClick={e => e.stopPropagation()}>
            <div className="rating-modal-header">
              <h3>Beri Rating</h3>
              <button className="close-modal-btn" onClick={() => setShowRatingModal(false)}>×</button>
            </div>
            <div className="rating-modal-content">
              {ratingItems.map((item, idx) => (
                <div key={idx} className="rating-item">
                  <span className="rating-item-name">{item.item_name}</span>
                  <div className="rating-stars">
                    {[1, 2, 3, 4, 5].map(star => (
                      <span
                        key={star}
                        className={`star ${item.rating >= star ? 'active' : ''}`}
                        onClick={() => {
                          const newItems = [...ratingItems]
                          newItems[idx].rating = star
                          setRatingItems(newItems)
                        }}
                      >★</span>
                    ))}
                  </div>
                </div>
              ))}
              <div className="rating-comment">
                <textarea
                  placeholder="Tulis komentar (opsional)..."
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <div className="rating-modal-footer">
              <button
                className="submit-rating-btn"
                onClick={submitRatings}
                disabled={submittingRating || !ratingItems.some(i => i.rating > 0)}
              >
                {submittingRating ? 'Mengirim...' : 'Kirim Rating'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .rate-order-btn {
          margin-top: 8px;
          padding: 4px 12px;
          font-size: 12px;
          background: #D4AF37;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .rating-modal {
          background: white;
          border-radius: 16px;
          width: 90%;
          max-width: 400px;
          max-height: 80vh;
          overflow: hidden;
        }
        .rating-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #eee;
        }
        .rating-modal-header h3 {
          margin: 0;
          font-size: 18px;
          color: var(--primary-blue);
        }
        .close-modal-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
        }
        .rating-modal-content {
          padding: 16px 20px;
          max-height: 300px;
          overflow-y: auto;
        }
        .rating-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #eee;
        }
        .rating-item:last-child {
          border-bottom: none;
        }
        .rating-item-name {
          font-size: 14px;
          color: #333;
          flex: 1;
          margin-right: 12px;
        }
        .rating-stars {
          display: flex;
          gap: 4px;
        }
        .star {
          font-size: 24px;
          color: #ddd;
          cursor: pointer;
          transition: color 0.2s;
        }
        .star.active {
          color: #D4AF37;
        }
        .star:hover {
          color: #D4AF37;
        }
        .rating-comment {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #eee;
        }
        .rating-comment textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 14px;
          resize: none;
          font-family: inherit;
        }
        .rating-comment textarea:focus {
          outline: none;
          border-color: var(--primary-blue);
        }
        .rating-modal-footer {
          padding: 16px 20px;
          border-top: 1px solid #eee;
        }
        .submit-rating-btn {
          width: 100%;
          padding: 12px;
          background: var(--primary-blue);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          cursor: pointer;
        }
        .submit-rating-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  )
}

export default OrderList
