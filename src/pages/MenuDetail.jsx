import { useState } from 'react'

function MenuDetail({ food, onNavigate, onAddToCart }) {
  const [selectedOption, setSelectedOption] = useState(food?.options?.[0] || null)
  const [quantity, setQuantity] = useState(0)
  const [selectedVariants, setSelectedVariants] = useState({})

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID').format(price)
  }

  const handleVariantSelect = (groupId, groupName, option, maxSelect) => {
    setSelectedVariants(prev => {
      const current = prev[groupId] || []
      const exists = current.find(o => o.id === option.id)
      
      if (exists) {
        return { ...prev, [groupId]: current.filter(o => o.id !== option.id) }
      } else {
        if (maxSelect === 1) {
          return { ...prev, [groupId]: [{ ...option, groupName }] }
        } else {
          if (current.length < maxSelect) {
            return { ...prev, [groupId]: [...current, { ...option, groupName }] }
          }
        }
      }
      return prev
    })
  }

  const isVariantSelected = (groupId, optionId) => {
    return (selectedVariants[groupId] || []).some(o => o.id === optionId)
  }

  const calculateTotalPrice = () => {
    // Ensure base price is a number
    let base = Number(selectedOption?.price) || Number(food.originalPrice) || 0
    Object.values(selectedVariants).forEach(options => {
      options.forEach(opt => {
        base += Number(opt.extra_price) || 0
      })
    })
    return base
  }

  const getSelectedVariantsSummary = () => {
    const all = []
    Object.values(selectedVariants).forEach(options => {
      options.forEach(opt => all.push(opt))
    })
    return all
  }

  const validateRequiredVariants = () => {
    if (!food.variants || food.variants.length === 0) return true
    for (const group of food.variants) {
      if (group.is_required) {
        const selected = selectedVariants[group.id] || []
        if (selected.length === 0) return false
      }
    }
    return true
  }

  const addToOrder = () => {
    if (quantity > 0 && food) {
      if (!validateRequiredVariants()) {
        alert('Pilih semua varian yang wajib')
        return
      }
      
      const variantsSummary = getSelectedVariantsSummary()
      const variants = variantsSummary.map(v => ({
        group: v.groupName,
        option: v.name,
        extra_price: Number(v.extra_price) || 0
      }))

      // Ensure price is always a number
      const totalPrice = Number(calculateTotalPrice()) || 0

      onAddToCart({
        id: Date.now(),
        menu_item_id: food.id,
        name: food.name,
        image_url: food.image,
        price: totalPrice,
        quantity: quantity,
        variants: variants,
        food: food,
        option: selectedOption
      })
      onNavigate('home')
    }
  }

  if (!food) return null

  const hasVariants = food.variants && food.variants.length > 0

  return (
    <div className="app menu-detail-page">
      <div className="menu-detail-image-container">
        <img 
          src={food.image} 
          alt={food.name} 
          className="menu-detail-image"
        />
        <button className="menu-detail-back" onClick={() => onNavigate('home')}>
          <svg viewBox="0 0 24 24" fill="white" width="20" height="20">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
        </button>
      </div>

      <div className="menu-detail-content">
        <h1 className="menu-detail-title">{food.name}</h1>
        
        <div className="menu-detail-meta">
          <div className="menu-meta-item">
            <span className="meta-dot green"></span>
            <span>{food.time}</span>
          </div>
          <div className="menu-meta-item">
            <svg viewBox="0 0 24 24" fill="#D4AF37" width="16" height="16">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
            </svg>
            <span>{food.rating} stars</span>
          </div>
        </div>

        <h3 className="menu-section-title">Description</h3>
        <p className="menu-description">{food.description}</p>

        {!hasVariants && food.options && food.options.length > 0 && (
          <>
            <h3 className="menu-section-title">Option</h3>
            <div className="menu-options-list">
              {food.options.map(option => (
                <div 
                  key={option.id}
                  className={`menu-option-item ${selectedOption?.id === option.id ? 'selected' : ''}`}
                  onClick={() => setSelectedOption(option)}
                >
                  <div className="menu-option-radio"></div>
                  <span className="menu-option-label">{option.name} - Rp {formatPrice(option.price)}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {hasVariants && food.variants.map(group => (
          <div key={group.id} className="variant-section">
            <h3 className="menu-section-title">
              {group.name}
              {group.is_required && <span className="required-badge">Wajib</span>}
              {group.max_select > 1 && <span className="max-select-info">Pilih maks {group.max_select}</span>}
            </h3>
            <div className="menu-options-list">
              {group.options && group.options.map(option => (
                <div 
                  key={option.id}
                  className={`menu-option-item ${isVariantSelected(group.id, option.id) ? 'selected' : ''}`}
                  onClick={() => handleVariantSelect(group.id, group.name, option, group.max_select)}
                >
                  <div className={group.max_select > 1 ? "menu-option-checkbox" : "menu-option-radio"}></div>
                  <span className="menu-option-label">
                    {option.name}
                    {option.extra_price > 0 && ` (+Rp ${formatPrice(option.extra_price)})`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="total-price-section">
          <span>Total Harga:</span>
          <span className="total-price">Rp {formatPrice(calculateTotalPrice())}</span>
        </div>
      </div>

      <div className="menu-detail-footer">
        <button className="menu-add-btn" onClick={addToOrder}>
          Add to order
        </button>
        <div className="menu-quantity-control">
          <button 
            className="menu-qty-btn minus"
            onClick={() => setQuantity(prev => Math.max(0, prev - 1))}
          >
            −
          </button>
          <div className="menu-qty-display">{quantity}</div>
          <button 
            className="menu-qty-btn plus"
            onClick={() => setQuantity(prev => prev + 1)}
          >
            +
          </button>
        </div>
      </div>

      <style>{`
        .variant-section {
          margin-bottom: 16px;
        }
        .required-badge {
          background: #fee2e2;
          color: #ef4444;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 4px;
          margin-left: 8px;
          font-weight: 500;
        }
        .max-select-info {
          color: #666;
          font-size: 11px;
          font-weight: 400;
          margin-left: 8px;
        }
        .menu-option-checkbox {
          width: 18px;
          height: 18px;
          border: 2px solid #ccc;
          border-radius: 4px;
          margin-right: 12px;
          flex-shrink: 0;
        }
        .menu-option-item.selected .menu-option-checkbox {
          background: var(--primary-blue);
          border-color: var(--primary-blue);
        }
        .menu-option-item.selected .menu-option-checkbox::after {
          content: '✓';
          color: white;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
        }
        .total-price-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 0;
          margin-top: 16px;
          border-top: 1px solid #eee;
          font-weight: 600;
        }
        .total-price {
          font-size: 18px;
          color: var(--primary-gold);
        }
      `}</style>
    </div>
  )
}

export default MenuDetail
