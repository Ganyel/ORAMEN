import { useState, useEffect } from 'react'
import { useOrderContext } from '../context/OrderContext'
import OrderContextHeader from '../components/OrderContextHeader'

const API_BASE = 'http://localhost:5000/api'

const navItems = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'ramen', label: 'Ramen', icon: 'ramen' },
  { id: 'bento', label: 'Rice and Bento', icon: 'bento' },
  { id: 'snack', label: 'Snack', icon: 'snack' },
  { id: 'drink', label: 'Drink', icon: 'drink' }
]

function Dashboard({ onNavigate, cartCount }) {
  const { orderType, tableNumber, setTableNumber, showTableModal, setShowTableModal } = useOrderContext()
  const [activeNav, setActiveNav] = useState('home')
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)

  const tables = Array.from({ length: 20 }, (_, i) => i + 1)

  // Fetch menu on component mount (empty dependency array)
  useEffect(() => {
    fetchMenu()
  }, [])

  // Handle table modal separately - show only for dine-in when no table selected
  useEffect(() => {
    if (orderType === 'dine-in' && !tableNumber) {
      setShowTableModal(true)
    }
  }, [orderType, tableNumber, setShowTableModal])

  const fetchMenu = async () => {
    console.log('[Dashboard] fetchMenu called, URL:', `${API_BASE}/menu`)
    try {
      setLoading(true)
      const res = await fetch(`${API_BASE}/menu`)
      const data = await res.json()
      console.log('[Dashboard] API response:', data)
      console.log('[Dashboard] data.success:', data.success)
      console.log('[Dashboard] data.data:', data.data)
      
      if (data.success && data.data) {
        const formattedItems = data.data.map(item => ({
          id: item.id,
          name: item.name,
          rating: item.rating_avg || item.rating || 0,
          ratingCount: item.rating_count || 0,
          image: item.image_url || 'https://images.unsplash.com/photo-1618841557871-b4664fbf0cb3?w=400&h=300&fit=crop',
          tags: item.category ? [item.category] : ['Menu'],
          description: item.description || '',
          options: [{ id: 1, name: 'Regular', price: item.price }],
          time: '15 mins',
          originalPrice: item.price,
          discountPrice: item.price,
          category: item.category,
          variants: item.variants || []
        }))
        console.log('[Dashboard] formattedItems:', formattedItems)
        setMenuItems(formattedItems)
      } else {
        console.error('[Dashboard] API returned success=false or no data')
      }
    } catch (err) {
      console.error('[Dashboard] Failed to fetch menu:', err)
    } finally {
      setLoading(false)
    }
  }

  // Map nav IDs to database category values
  const categoryMap = {
    'ramen': 'ramen',
    'bento': 'rice-and-bento',
    'snack': 'snack',
    'drink': 'drink'
  }

  // Filter menu based on activeNav (case-insensitive)
  const foodData = activeNav === 'home' 
    ? menuItems 
    : menuItems.filter(item => 
        item.category?.toLowerCase() === categoryMap[activeNav]?.toLowerCase()
      )

  // Debug logs
  console.log('[Dashboard] menuItems state:', menuItems)
  console.log('[Dashboard] activeNav:', activeNav)
  console.log('[Dashboard] foodData after filter:', foodData)

  const renderNavIcon = (iconType) => {
    switch (iconType) {
      case 'home':
        return (
          <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path d="M12 3L4 9v12h5v-7h6v7h5V9l-8-6z"/>
          </svg>
        )
      case 'ramen':
        return (
          <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
          </svg>
        )
      case 'bento':
        return (
          <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path d="M2 19h20v2H2v-2zm1-1h18c0-2.21-1.79-4-4-4h-3v-2c1.66 0 3-1.34 3-3V5H7v4c0 1.66 1.34 3 3 3v2H7c-2.21 0-4 1.79-4 4z"/>
          </svg>
        )
      case 'snack':
        return (
          <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path d="M18 3H6C4.34 3 3 4.34 3 6v12c0 1.66 1.34 3 3 3h12c1.66 0 3-1.34 3-3V6c0-1.66-1.34-3-3-3zm-6 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
          </svg>
        )
      case 'drink':
        return (
          <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path d="M3 2l2.01 18.23C5.13 21.23 5.97 22 7 22h10c1.03 0 1.87-.77 1.99-1.77L21 2H3zm9 17c-1.66 0-3-1.34-3-3 0-2 3-5.4 3-5.4s3 3.4 3 5.4c0 1.66-1.34 3-3 3zm6.33-11H5.67l-.44-4h13.54l-.44 4z"/>
          </svg>
        )
      default:
        return null
    }
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-top">
          <div className="location">
            <span className="location-pin">
              <svg viewBox="0 0 24 24" fill="#1E3A5F" width="16" height="16">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </span>
            <span className="location-text">Jl. KH Jl. Moch. Safei No.2449, Kebondalem...</span>
            <span className="location-arrow">›</span>
          </div>
          <button className="order-list-btn" onClick={() => onNavigate('order-list')}>
            Order List
          </button>
          <button className="order-list-btn" onClick={() => onNavigate('admin')} style={{ marginLeft: '8px', background: 'var(--primary-blue)', color: 'white', borderRadius: '8px', padding: '4px 12px' }}>
            Admin
          </button>
        </div>
        
        <div className="header-main">
          <OrderContextHeader mode="editable" onTableClick={() => setShowTableModal(true)} />
          <button className="cart-btn" onClick={() => cartCount > 0 && onNavigate('order')}>
            <svg viewBox="0 0 24 24" fill="#1E3A5F" width="24" height="24">
              <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>
        </div>
      </header>

      <nav className="nav">
        {navItems.map(item => (
          <div 
            key={item.id}
            className={`nav-item ${activeNav === item.id ? 'active' : ''}`}
            onClick={() => setActiveNav(item.id)}
          >
            <div className="nav-icon">
              {renderNavIcon(item.icon)}
            </div>
            <span className="nav-label">{item.label}</span>
          </div>
        ))}
      </nav>

      <main className="main-content">
        <div className="search-container">
          <div className="search-box">
            <svg viewBox="0 0 24 24" fill="#999" width="20" height="20">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            <input type="text" placeholder="Search for your meal" />
          </div>
        </div>

        <section className="section">
          <h2 className="section-title">Popular Food</h2>
          <div className="food-grid popular-grid">
            {foodData.slice(0, 2).map(food => (
              <div 
                key={food.id} 
                className="food-card popular-card"
                onClick={() => onNavigate('menu-detail', food)}
              >
                <div className="food-card-image-wrapper popular-image-wrapper">
                  <img 
                    src={food.image} 
                    alt={food.name} 
                    className="food-card-image"
                  />
                </div>
                <div className="food-card-content">
                  <h3 className="food-card-title">{food.name}</h3>
                  <div className="food-card-rating">
                    <svg viewBox="0 0 24 24" fill="#D4AF37" width="14" height="14">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                    </svg>
                    <span>{food.rating > 0 ? food.rating : '-'}</span>
                    {food.ratingCount > 0 && <span className="rating-count">({food.ratingCount})</span>}
                  </div>
                  <div className="food-card-tags">
                    {food.tags.map((tag, idx) => (
                      <span 
                        key={idx} 
                        className={`tag ${idx === 0 ? 'blue' : 'gold'}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="section">
          <h2 className="section-title">Other Menu</h2>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Memuat menu...</div>
          ) : foodData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Tidak ada menu tersedia</div>
          ) : (
            <div className="food-grid other-grid">
              {foodData.map(food => (
                <div 
                  key={food.id} 
                  className="food-card other-card"
                  onClick={() => onNavigate('menu-detail', food)}
                >
                  <div className="food-card-image-wrapper other-image-wrapper">
                    <img 
                      src={food.image} 
                      alt={food.name} 
                      className="food-card-image"
                    />
                  </div>
                  <div className="food-card-content">
                    <h3 className="food-card-title">{food.name}</h3>
                    <div className="food-card-rating">
                      <svg viewBox="0 0 24 24" fill="#D4AF37" width="14" height="14">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                      </svg>
                      <span>{food.rating > 0 ? food.rating : '-'}</span>
                      {food.ratingCount > 0 && <span className="rating-count">({food.ratingCount})</span>}
                    </div>
                    <p className="food-card-price">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(food.originalPrice)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {showTableModal && orderType === 'dine-in' && (
        <div className="modal-overlay" onClick={() => tableNumber && setShowTableModal(false)}>
          <div className="table-modal" onClick={e => e.stopPropagation()}>
            <div className="table-modal-header">
              <h3>Pilih Nomor Meja</h3>
              {tableNumber && (
                <button className="close-modal-btn" onClick={() => setShowTableModal(false)}>×</button>
              )}
            </div>
            <div className="table-modal-content">
              <div className="table-grid">
                {tables.map(table => (
                  <button
                    key={table}
                    className={`table-option ${tableNumber === table ? 'selected' : ''}`}
                    onClick={() => setTableNumber(table)}
                  >
                    {table}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
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
        .table-modal {
          background: white;
          border-radius: 16px;
          width: 90%;
          max-width: 400px;
          max-height: 80vh;
          overflow: hidden;
        }
        .table-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #eee;
        }
        .table-modal-header h3 {
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
          padding: 0;
          line-height: 1;
        }
        .table-modal-content {
          padding: 20px;
          overflow-y: auto;
          max-height: calc(80vh - 60px);
        }
        .table-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }
        .table-option {
          aspect-ratio: 1;
          border: 2px solid #ddd;
          border-radius: 12px;
          background: white;
          font-size: 18px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          color: var(--text-dark);
        }
        .table-option:hover {
          border-color: var(--primary-blue);
          background: #f0f7ff;
        }
        .table-option.selected {
          border-color: var(--primary-blue);
          background: var(--primary-blue);
          color: white;
        }
      `}</style>
    </div>
  )
}

export default Dashboard
