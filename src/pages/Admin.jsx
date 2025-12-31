import { useState, useEffect, useRef, useCallback } from 'react'
import MonthlyReport from './MonthlyReport'
import { API_ADMIN_URL } from '../config/api'

const API_BASE = API_ADMIN_URL
const POLLING_INTERVAL = 5000 // 5 seconds

function Admin({ onNavigate }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [loginError, setLoginError] = useState('')
  const [activeTab, setActiveTab] = useState('dashboard')
  const [stats, setStats] = useState(null)
  const [orders, setOrders] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [showMenuModal, setShowMenuModal] = useState(false)
  const [editingMenu, setEditingMenu] = useState(null)
  const [menuForm, setMenuForm] = useState({
    name: '', description: '', category: '', price: '', image_url: ''
  })
  const [imageFile, setImageFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [variants, setVariants] = useState([])
  const [showVariantModal, setShowVariantModal] = useState(false)
  const [variantMenuId, setVariantMenuId] = useState(null)
  const [variantMenuName, setVariantMenuName] = useState('')
  
  // Polling refs to prevent overlapping requests
  const pollingRef = useRef(null)
  const isFetchingRef = useRef(false)

  // Polling function - fetches orders and stats without setting loading state
  const pollData = useCallback(async () => {
    if (isFetchingRef.current) return // Prevent overlapping requests
    
    isFetchingRef.current = true
    try {
      const url = statusFilter ? `${API_BASE}/orders?status=${statusFilter}` : `${API_BASE}/orders`
      const [ordersRes, statsRes] = await Promise.all([
        fetch(url),
        fetch(`${API_BASE}/stats`)
      ])
      
      const ordersData = await ordersRes.json()
      const statsData = await statsRes.json()
      
      if (ordersData.success) setOrders(ordersData.data)
      if (statsData.success) setStats(statsData.data)
    } catch (err) {
      console.error('Polling failed:', err)
    } finally {
      isFetchingRef.current = false
    }
  }, [statusFilter])

  // Start polling when admin logs in
  useEffect(() => {
    if (isLoggedIn) {
      fetchStats()
      fetchOrders()
      fetchMenu()
      
      // Start polling interval
      pollingRef.current = setInterval(pollData, POLLING_INTERVAL)
    }
    
    // Cleanup: stop polling on logout or unmount
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
  }, [isLoggedIn, pollData])

  useEffect(() => {
    if (isLoggedIn) {
      fetchOrders()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/stats`)
      const data = await res.json()
      if (data.success) setStats(data.data)
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const url = statusFilter ? `${API_BASE}/orders?status=${statusFilter}` : `${API_BASE}/orders`
      const res = await fetch(url)
      const data = await res.json()
      if (data.success) setOrders(data.data)
    } catch (err) {
      console.error('Failed to fetch orders:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchMenu = async () => {
    try {
      const res = await fetch(`${API_BASE}/menu`)
      const data = await res.json()
      if (data.success) setMenuItems(data.data)
    } catch (err) {
      console.error('Failed to fetch menu:', err)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginError('')
    
    // Local authentication with hardcoded credentials
    if (loginForm.username === 'admin' && loginForm.password === 'admin123') {
      setIsLoggedIn(true)
      return
    }
    
    // Fallback to API login if local auth fails
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      })
      const data = await res.json()
      if (data.success) {
        setIsLoggedIn(true)
      } else {
        setLoginError(data.message || 'Username atau password salah')
      }
    } catch (err) {
      setLoginError('Username atau password salah')
    }
  }

  const handleLogout = () => {
    // Stop polling before logout
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
    setIsLoggedIn(false)
    setLoginForm({ username: '', password: '' })
  }

  const handleImageUpload = async (file) => {
    if (!file) return null
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      setUploading(false)
      if (data.success) return data.url
      return null
    } catch (err) {
      setUploading(false)
      console.error('Upload failed:', err)
      return null
    }
  }

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await fetch(`${API_BASE}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      fetchOrders()
      fetchStats()
    } catch (err) {
      console.error('Failed to update order:', err)
    }
  }

  const deleteOrder = async (orderId) => {
    if (!window.confirm('Hapus pesanan ini?')) return
    try {
      await fetch(`${API_BASE}/orders/${orderId}`, { method: 'DELETE' })
      fetchOrders()
      fetchStats()
    } catch (err) {
      console.error('Failed to delete order:', err)
    }
  }

  const handleMenuSubmit = async (e) => {
    e.preventDefault()
    
    let finalImageUrl = menuForm.image_url
    
    // Upload image if a file was selected
    if (imageFile) {
      const uploadedUrl = await handleImageUpload(imageFile)
      if (uploadedUrl) {
        finalImageUrl = uploadedUrl
      }
    }
    
    const menuData = {
      name: menuForm.name,
      description: menuForm.description,
      category: menuForm.category,
      price: parseFloat(menuForm.price),
      image_url: finalImageUrl,
      is_available: true
    }
    
    try {
      const method = editingMenu ? 'PUT' : 'POST'
      const url = editingMenu ? `${API_BASE}/menu/${editingMenu.id}` : `${API_BASE}/menu`
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(menuData)
      })
      const data = await res.json()
      
      if (data.success) {
        setShowMenuModal(false)
        setEditingMenu(null)
        setMenuForm({ name: '', description: '', category: '', price: '', image_url: '' })
        setImageFile(null)
        fetchMenu()
        fetchStats()
      } else {
        alert('Gagal menyimpan menu: ' + (data.message || 'Unknown error'))
      }
    } catch (err) {
      console.error('Backend error:', err)
      alert('Server tidak tersedia. Pastikan server backend berjalan.')
    }
  }

  const deleteMenuItem = async (id) => {
    if (!window.confirm('Hapus menu ini?')) return
    try {
      const res = await fetch(`${API_BASE}/menu/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        fetchMenu()
        fetchStats()
      } else {
        alert('Gagal menghapus menu')
      }
    } catch (err) {
      console.error('Failed to delete menu:', err)
      alert('Server tidak tersedia')
    }
  }

  const openEditMenu = (item) => {
    setEditingMenu(item)
    setMenuForm({
      name: item.name,
      description: item.description || '',
      category: item.category || '',
      price: item.price.toString(),
      image_url: item.image_url || ''
    })
    setImageFile(null)
    setShowMenuModal(true)
  }

  // Variant management functions
  const openVariantModal = async (item) => {
    setVariantMenuId(item.id)
    setVariantMenuName(item.name)
    try {
      const res = await fetch(`${API_BASE}/menu/${item.id}/variants`)
      const data = await res.json()
      if (data.success) {
        setVariants(data.data || [])
      } else {
        setVariants([])
      }
    } catch (err) {
      console.error('Failed to fetch variants:', err)
      setVariants([])
    }
    setShowVariantModal(true)
  }

  const addVariantGroup = () => {
    setVariants([...variants, { name: '', is_required: false, max_select: 1, options: [] }])
  }

  const updateVariantGroup = (index, field, value) => {
    const updated = [...variants]
    updated[index][field] = value
    setVariants(updated)
  }

  const removeVariantGroup = (index) => {
    setVariants(variants.filter((_, i) => i !== index))
  }

  const addVariantOption = (groupIndex) => {
    const updated = [...variants]
    updated[groupIndex].options = [...(updated[groupIndex].options || []), { name: '', extra_price: 0 }]
    setVariants(updated)
  }

  const updateVariantOption = (groupIndex, optionIndex, field, value) => {
    const updated = [...variants]
    updated[groupIndex].options[optionIndex][field] = value
    setVariants(updated)
  }

  const removeVariantOption = (groupIndex, optionIndex) => {
    const updated = [...variants]
    updated[groupIndex].options = updated[groupIndex].options.filter((_, i) => i !== optionIndex)
    setVariants(updated)
  }

  const saveVariants = async () => {
    try {
      const res = await fetch(`${API_BASE}/menu/${variantMenuId}/variants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variants })
      })
      const data = await res.json()
      if (data.success) {
        setShowVariantModal(false)
        alert('Varian berhasil disimpan')
      } else {
        alert('Gagal menyimpan varian')
      }
    } catch (err) {
      console.error('Failed to save variants:', err)
      alert('Server tidak tersedia')
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'menunggu': return '#f97316'
      case 'sedang-dibuat': return '#3b82f6'
      case 'siap': return '#22c55e'
      case 'selesai': return '#6b7280'
      case 'dibatalkan': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'menunggu': return 'Menunggu'
      case 'sedang-dibuat': return 'Sedang Dibuat'
      case 'siap': return 'Siap'
      case 'selesai': return 'Selesai'
      case 'dibatalkan': return 'Dibatalkan'
      default: return status
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="admin-page">
        <header className="admin-header">
          <button className="back-btn" onClick={() => onNavigate('home')}>
            <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
          </button>
          <h1 className="admin-title">Admin Login</h1>
          <div style={{ width: 40 }}></div>
        </header>
        <main className="admin-content">
          <div className="login-container">
            <form onSubmit={handleLogin} className="login-form">
              <h2>Masuk ke Admin</h2>
              {loginError && <p className="login-error">{loginError}</p>}
              <div className="form-group">
                <label>Username</label>
                <input 
                  type="text" 
                  value={loginForm.username} 
                  onChange={(e) => setLoginForm({...loginForm, username: e.target.value})} 
                  required 
                  placeholder="Masukkan username"
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input 
                  type="password" 
                  value={loginForm.password} 
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})} 
                  required 
                  placeholder="Masukkan password"
                />
              </div>
              <button type="submit" className="login-btn">Masuk</button>
            </form>
          </div>
        </main>
        <style>{`
          .admin-page {
            min-height: 100vh;
            background: #f5f5f5;
          }
          .admin-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px;
            background: var(--primary-blue);
            color: white;
          }
          .admin-header .back-btn {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            padding: 8px;
          }
          .admin-title {
            font-size: 18px;
            font-weight: 600;
          }
          .admin-content {
            padding: 16px;
          }
          .login-container {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: calc(100vh - 100px);
          }
          .login-form {
            background: white;
            padding: 32px;
            border-radius: 16px;
            width: 100%;
            max-width: 400px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          }
          .login-form h2 {
            text-align: center;
            margin-bottom: 24px;
            color: var(--primary-blue);
          }
          .login-form .form-group {
            margin-bottom: 16px;
          }
          .login-form label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: var(--text-dark);
          }
          .login-form input {
            width: 100%;
            padding: 12px 16px;
            border: 1px solid #ddd;
            border-radius: 8px;
            font-size: 14px;
            transition: border-color 0.2s;
          }
          .login-form input:focus {
            outline: none;
            border-color: var(--primary-blue);
          }
          .login-error {
            background: #fee2e2;
            color: #ef4444;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 16px;
            text-align: center;
            font-size: 14px;
          }
          .login-btn {
            width: 100%;
            padding: 14px;
            background: var(--primary-blue);
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            margin-top: 8px;
            transition: opacity 0.2s;
          }
          .login-btn:hover {
            opacity: 0.9;
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <button className="back-btn" onClick={() => onNavigate('home')}>
          <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
        </button>
        <h1 className="admin-title">Admin Dashboard</h1>
        <button className="logout-btn" onClick={handleLogout}>
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
          </svg>
        </button>
      </header>

      <nav className="admin-nav">
        <button className={`admin-nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
          Dashboard
        </button>
        <button className={`admin-nav-btn ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
          Pesanan
        </button>
        <button className={`admin-nav-btn ${activeTab === 'menu' ? 'active' : ''}`} onClick={() => setActiveTab('menu')}>
          Menu
        </button>
        <button className={`admin-nav-btn ${activeTab === 'report' ? 'active' : ''}`} onClick={() => setActiveTab('report')}>
          Laporan
        </button>
      </nav>

      <main className="admin-content">
        {activeTab === 'dashboard' && stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon blue">
                <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.totalOrders}</span>
                <span className="stat-label">Total Pesanan</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green">
                <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.todayOrders}</span>
                <span className="stat-label">Pesanan Hari Ini</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon gold">
                <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                  <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
                </svg>
              </div>
              <div className="stat-info">
                <span className="stat-value">{formatCurrency(stats.totalRevenue)}</span>
                <span className="stat-label">Total Pendapatan</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon orange">
                <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                  <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.2 14.2L11 13V7h1.5v5.2l4.5 2.7-.8 1.3z"/>
                </svg>
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.pendingOrders}</span>
                <span className="stat-label">Pesanan Pending</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon purple">
                <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                  <path d="M18 3H6C4.34 3 3 4.34 3 6v12c0 1.66 1.34 3 3 3h12c1.66 0 3-1.34 3-3V6c0-1.66-1.34-3-3-3zm-6 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
                </svg>
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.menuItems}</span>
                <span className="stat-label">Item Menu</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon teal">
                <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                  <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
                </svg>
              </div>
              <div className="stat-info">
                <span className="stat-value">{formatCurrency(stats.todayRevenue)}</span>
                <span className="stat-label">Pendapatan Hari Ini</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="orders-section">
            <div className="orders-filter">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
                <option value="">Semua Status</option>
                <option value="menunggu">Menunggu</option>
                <option value="sedang-dibuat">Sedang Dibuat</option>
                <option value="siap">Siap</option>
                <option value="selesai">Selesai</option>
                <option value="dibatalkan">Dibatalkan</option>
              </select>
            </div>
            {loading ? (
              <div className="loading">Memuat...</div>
            ) : (
              <div className="orders-list">
                {orders.map(order => (
                  <div key={order.id} className="order-card">
                    <div className="order-card-header">
                      <div>
                        <span className="order-number">{order.order_number}</span>
                        <span className="order-table">Meja {order.table_number}</span>
                      </div>
                      <span className="order-status" style={{ backgroundColor: getStatusColor(order.status) }}>
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                    <div className="order-card-body">
                      <p className="order-customer">{order.customer_name}</p>
                      <p className="order-amount">{formatCurrency(order.total_amount)}</p>
                      <p className="order-time">{new Date(order.created_at).toLocaleString('id-ID')}</p>
                    </div>
                    <div className="order-card-actions">
                      <select 
                        value={order.status} 
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        className="status-select"
                      >
                        <option value="menunggu">Menunggu</option>
                        <option value="sedang-dibuat">Sedang Dibuat</option>
                        <option value="siap">Siap</option>
                        <option value="selesai">Selesai</option>
                        <option value="dibatalkan">Dibatalkan</option>
                      </select>
                      <button className="delete-btn" onClick={() => deleteOrder(order.id)}>
                        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
                {orders.length === 0 && <p className="no-data">Tidak ada pesanan</p>}
              </div>
            )}
          </div>
        )}

        {activeTab === 'menu' && (
          <div className="menu-section">
            <button className="add-menu-btn" onClick={() => { setEditingMenu(null); setMenuForm({ name: '', description: '', category: '', price: '', image_url: '' }); setImageFile(null); setShowMenuModal(true) }}>
              + Tambah Menu
            </button>
            <div className="menu-list">
              {menuItems.map(item => (
                <div key={item.id} className="menu-card">
                  {item.image_url && <img src={item.image_url} alt={item.name} className="menu-card-img" />}
                  <div className="menu-card-info">
                    <h3>{item.name}</h3>
                    <p className="menu-category">{item.category}</p>
                    <p className="menu-price">{formatCurrency(item.price)}</p>
                  </div>
                  <div className="menu-card-actions">
                    <button className="variant-btn" onClick={() => openVariantModal(item)}>Varian</button>
                    <button className="edit-btn" onClick={() => openEditMenu(item)}>Edit</button>
                    <button className="delete-btn" onClick={() => deleteMenuItem(item.id)}>Hapus</button>
                  </div>
                </div>
              ))}
              {menuItems.length === 0 && <p className="no-data">Tidak ada menu</p>}
            </div>
          </div>
        )}

        {activeTab === 'report' && (
          <MonthlyReport />
        )}
      </main>

      {showMenuModal && (
        <div className="modal-overlay" onClick={() => setShowMenuModal(false)}>
          <div className="menu-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingMenu ? 'Edit Menu' : 'Tambah Menu'}</h2>
            <form onSubmit={handleMenuSubmit}>
              <div className="form-group">
                <label>Nama</label>
                <input type="text" value={menuForm.name} onChange={(e) => setMenuForm({...menuForm, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Deskripsi</label>
                <textarea value={menuForm.description} onChange={(e) => setMenuForm({...menuForm, description: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Kategori</label>
                <select value={menuForm.category} onChange={(e) => setMenuForm({...menuForm, category: e.target.value})} required>
                  <option value="">Pilih Kategori</option>
                  <option value="ramen">Ramen</option>
                  <option value="rice-and-bento">Rice and Bento</option>
                  <option value="snack">Snack</option>
                  <option value="drink">Drink</option>
                </select>
              </div>
              <div className="form-group">
                <label>Harga</label>
                <input type="number" value={menuForm.price} onChange={(e) => setMenuForm({...menuForm, price: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Gambar</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0]
                    if (file) {
                      setImageFile(file)
                      const reader = new FileReader()
                      reader.onloadend = () => {
                        setMenuForm({...menuForm, image_url: reader.result})
                      }
                      reader.readAsDataURL(file)
                    }
                  }}
                />
                {uploading && <p className="upload-status">Mengupload gambar...</p>}
                <input 
                  type="text" 
                  value={imageFile ? '' : menuForm.image_url} 
                  onChange={(e) => { setMenuForm({...menuForm, image_url: e.target.value}); setImageFile(null); }} 
                  placeholder="Atau masukkan URL gambar"
                  style={{ marginTop: '8px' }}
                  disabled={!!imageFile}
                />
                {menuForm.image_url && (
                  <div className="image-preview">
                    <img src={menuForm.image_url} alt="Preview" />
                  </div>
                )}
              </div>
              <div className="modal-actions">
                <button type="button" className="secondary-btn" onClick={() => setShowMenuModal(false)}>Batal</button>
                <button type="submit" className="primary-btn">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showVariantModal && (
        <div className="modal-overlay" onClick={() => setShowVariantModal(false)}>
          <div className="variant-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Kelola Varian - {variantMenuName}</h2>
            <div className="variant-list">
              {variants.map((group, groupIndex) => (
                <div key={groupIndex} className="variant-group">
                  <div className="variant-group-header">
                    <input
                      type="text"
                      placeholder="Nama Grup (contoh: Ukuran, Topping)"
                      value={group.name}
                      onChange={(e) => updateVariantGroup(groupIndex, 'name', e.target.value)}
                      className="variant-group-name"
                    />
                    <button className="remove-group-btn" onClick={() => removeVariantGroup(groupIndex)}>×</button>
                  </div>
                  <div className="variant-group-settings">
                    <label>
                      <input
                        type="checkbox"
                        checked={group.is_required}
                        onChange={(e) => updateVariantGroup(groupIndex, 'is_required', e.target.checked)}
                      />
                      Wajib dipilih
                    </label>
                    <label>
                      Maks pilih:
                      <input
                        type="number"
                        min="1"
                        value={group.max_select}
                        onChange={(e) => updateVariantGroup(groupIndex, 'max_select', parseInt(e.target.value) || 1)}
                        className="max-select-input"
                      />
                    </label>
                  </div>
                  <div className="variant-options">
                    {(group.options || []).map((option, optionIndex) => (
                      <div key={optionIndex} className="variant-option">
                        <input
                          type="text"
                          placeholder="Nama opsi"
                          value={option.name}
                          onChange={(e) => updateVariantOption(groupIndex, optionIndex, 'name', e.target.value)}
                          className="option-name"
                        />
                        <input
                          type="number"
                          placeholder="Harga tambahan"
                          value={option.extra_price}
                          onChange={(e) => updateVariantOption(groupIndex, optionIndex, 'extra_price', parseFloat(e.target.value) || 0)}
                          className="option-price"
                        />
                        <button className="remove-option-btn" onClick={() => removeVariantOption(groupIndex, optionIndex)}>×</button>
                      </div>
                    ))}
                    <button className="add-option-btn" onClick={() => addVariantOption(groupIndex)}>+ Tambah Opsi</button>
                  </div>
                </div>
              ))}
              <button className="add-group-btn" onClick={addVariantGroup}>+ Tambah Grup Varian</button>
            </div>
            <div className="modal-actions">
              <button type="button" className="secondary-btn" onClick={() => setShowVariantModal(false)}>Batal</button>
              <button type="button" className="primary-btn" onClick={saveVariants}>Simpan Varian</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .admin-page {
          min-height: 100vh;
          background: #f5f5f5;
        }
        .admin-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          background: var(--primary-blue);
          color: white;
        }
        .admin-header .back-btn {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          padding: 8px;
        }
        .logout-btn {
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .logout-btn:hover {
          background: rgba(255,255,255,0.3);
        }
        .admin-title {
          font-size: 18px;
          font-weight: 600;
        }
        .admin-nav {
          display: flex;
          background: white;
          padding: 8px;
          gap: 8px;
          border-bottom: 1px solid #eee;
        }
        .admin-nav-btn {
          flex: 1;
          padding: 12px;
          border: none;
          background: #f0f0f0;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .admin-nav-btn.active {
          background: var(--primary-blue);
          color: white;
        }
        .admin-content {
          padding: 16px;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        .stat-icon.blue { background: #3b82f6; }
        .stat-icon.green { background: #22c55e; }
        .stat-icon.gold { background: #D4AF37; }
        .stat-icon.orange { background: #f97316; }
        .stat-icon.purple { background: #8b5cf6; }
        .stat-icon.teal { background: #14b8a6; }
        .stat-info {
          display: flex;
          flex-direction: column;
        }
        .stat-value {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-dark);
        }
        .stat-label {
          font-size: 11px;
          color: var(--text-gray);
        }
        .orders-filter {
          margin-bottom: 16px;
        }
        .filter-select, .status-select {
          padding: 10px 16px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 14px;
          background: white;
          cursor: pointer;
        }
        .orders-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .order-card {
          background: white;
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .order-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .order-number {
          font-weight: 700;
          color: var(--primary-blue);
          margin-right: 8px;
        }
        .order-table {
          font-size: 12px;
          color: var(--text-gray);
          background: #f0f0f0;
          padding: 4px 8px;
          border-radius: 4px;
        }
        .order-status {
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 11px;
          font-weight: 600;
          color: white;
        }
        .order-card-body {
          margin-bottom: 12px;
        }
        .order-customer {
          font-weight: 600;
          margin-bottom: 4px;
        }
        .order-amount {
          color: var(--primary-gold);
          font-weight: 600;
          margin-bottom: 4px;
        }
        .order-time {
          font-size: 12px;
          color: var(--text-gray);
        }
        .order-card-actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .order-card-actions .status-select {
          flex: 1;
        }
        .delete-btn {
          background: #fee2e2;
          border: none;
          padding: 8px;
          border-radius: 8px;
          cursor: pointer;
          color: #ef4444;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .add-menu-btn {
          width: 100%;
          padding: 14px;
          background: var(--primary-blue);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          margin-bottom: 16px;
        }
        .menu-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .menu-card {
          background: white;
          border-radius: 12px;
          padding: 12px;
          display: flex;
          gap: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .menu-card-img {
          width: 80px;
          height: 80px;
          object-fit: cover;
          border-radius: 8px;
        }
        .menu-card-info {
          flex: 1;
        }
        .menu-card-info h3 {
          font-size: 16px;
          margin-bottom: 4px;
        }
        .menu-category {
          font-size: 12px;
          color: var(--text-gray);
          margin-bottom: 4px;
        }
        .menu-price {
          font-weight: 600;
          color: var(--primary-gold);
          margin-bottom: 4px;
        }

        .menu-card-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .edit-btn {
          background: #e0f2fe;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          color: #0284c7;
          font-weight: 500;
        }
        .menu-card-actions .delete-btn {
          padding: 8px 16px;
        }
        .no-data {
          text-align: center;
          color: var(--text-gray);
          padding: 40px;
        }
        .loading {
          text-align: center;
          padding: 40px;
          color: var(--text-gray);
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
          padding: 20px;
        }
        .menu-modal {
          background: white;
          border-radius: 16px;
          padding: 24px;
          width: 100%;
          max-width: 400px;
          max-height: 90vh;
          overflow-y: auto;
        }
        .menu-modal h2 {
          margin-bottom: 20px;
          font-size: 20px;
        }
        .menu-modal .form-group {
          margin-bottom: 16px;
        }
        .menu-modal label {
          display: block;
          margin-bottom: 6px;
          font-size: 14px;
          font-weight: 500;
        }
        .menu-modal input, .menu-modal textarea, .menu-modal select {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 14px;
          background: white;
        }
        .menu-modal select {
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 36px;
        }
        .menu-modal select:focus {
          outline: none;
          border-color: var(--primary-blue);
        }
        .menu-modal textarea {
          min-height: 80px;
          resize: vertical;
        }
        .menu-modal input[type="file"] {
          padding: 8px;
          border: 2px dashed #ddd;
          border-radius: 8px;
          cursor: pointer;
        }
        .menu-modal input:disabled {
          background: #f5f5f5;
          color: #999;
        }
        .upload-status {
          color: var(--primary-blue);
          font-size: 12px;
          margin-top: 4px;
        }
        .image-preview {
          margin-top: 12px;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #ddd;
        }
        .image-preview img {
          width: 100%;
          max-height: 150px;
          object-fit: cover;
        }
        .modal-actions {
          display: flex;
          gap: 12px;
          margin-top: 20px;
        }
        .modal-actions button {
          flex: 1;
          padding: 14px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
        }
        .modal-actions .secondary-btn {
          background: #f0f0f0;
          border: none;
          color: var(--text-dark);
        }
        .modal-actions .primary-btn {
          background: var(--primary-blue);
          border: none;
          color: white;
        }
        .variant-btn {
          background: #f0fdf4;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          color: #16a34a;
          font-weight: 500;
        }
        .variant-modal {
          background: white;
          border-radius: 16px;
          padding: 24px;
          width: 100%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
        }
        .variant-modal h2 {
          margin-bottom: 20px;
          font-size: 18px;
          color: var(--primary-blue);
        }
        .variant-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .variant-group {
          border: 1px solid #ddd;
          border-radius: 12px;
          padding: 16px;
          background: #fafafa;
        }
        .variant-group-header {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
        }
        .variant-group-name {
          flex: 1;
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
        }
        .remove-group-btn {
          background: #fee2e2;
          border: none;
          width: 36px;
          height: 36px;
          border-radius: 8px;
          color: #ef4444;
          font-size: 20px;
          cursor: pointer;
        }
        .variant-group-settings {
          display: flex;
          gap: 16px;
          margin-bottom: 12px;
          font-size: 13px;
          color: #666;
        }
        .variant-group-settings label {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .max-select-input {
          width: 50px;
          padding: 4px 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          text-align: center;
        }
        .variant-options {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .variant-option {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .option-name {
          flex: 2;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 13px;
        }
        .option-price {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 13px;
        }
        .remove-option-btn {
          background: #fee2e2;
          border: none;
          width: 28px;
          height: 28px;
          border-radius: 6px;
          color: #ef4444;
          font-size: 16px;
          cursor: pointer;
        }
        .add-option-btn {
          background: none;
          border: 1px dashed #ddd;
          padding: 8px;
          border-radius: 6px;
          color: #666;
          font-size: 12px;
          cursor: pointer;
          margin-top: 4px;
        }
        .add-option-btn:hover {
          border-color: var(--primary-blue);
          color: var(--primary-blue);
        }
        .add-group-btn {
          background: none;
          border: 2px dashed #ddd;
          padding: 14px;
          border-radius: 12px;
          color: #666;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
        }
        .add-group-btn:hover {
          border-color: var(--primary-blue);
          color: var(--primary-blue);
        }
      `}</style>
    </div>
  )
}

export default Admin
