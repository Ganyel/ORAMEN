const express = require('express');
const cors = require('cors');
const midtransClient = require('midtrans-client');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./db');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration for production
const allowedOrigins = process.env.FRONTEND_URL 
  ? [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000']
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins for now, can be restricted later
    }
  },
  credentials: true
}));
app.use(express.json());

// Static folder for uploaded images
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Multer config for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files allowed'));
    }
  }
});

// Admin credentials (in production, use hashed passwords and database)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

let snap = null;

// Midtrans initialization with validation
console.log('=== MIDTRANS CONFIGURATION CHECK ===');
console.log('MIDTRANS_SERVER_KEY loaded:', process.env.MIDTRANS_SERVER_KEY ? `${process.env.MIDTRANS_SERVER_KEY.substring(0, 15)}...` : 'NOT SET');
console.log('MIDTRANS_CLIENT_KEY loaded:', process.env.MIDTRANS_CLIENT_KEY ? `${process.env.MIDTRANS_CLIENT_KEY.substring(0, 15)}...` : 'NOT SET');
console.log('MIDTRANS_IS_PRODUCTION:', process.env.MIDTRANS_IS_PRODUCTION);

const serverKey = process.env.MIDTRANS_SERVER_KEY;
const clientKey = process.env.MIDTRANS_CLIENT_KEY;
const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';

if (serverKey && clientKey && !serverKey.includes('YOUR_SERVER_KEY')) {
  // Validate key formats
  const isServerKeySandbox = serverKey.startsWith('SB-Mid-server-');
  const isServerKeyProduction = serverKey.startsWith('Mid-server-');
  const isClientKeyValid = clientKey.startsWith('Mid-client-') || clientKey.startsWith('SB-Mid-client-');
  
  if (!isClientKeyValid) {
    console.error('ERROR: Client key must start with "Mid-client-" or "SB-Mid-client-"');
    console.warn('Midtrans Snap NOT initialized - invalid client key');
  } else if (!isProduction && !isServerKeySandbox) {
    console.error('ERROR: Sandbox mode (MIDTRANS_IS_PRODUCTION=false) requires server key starting with "SB-Mid-server-"');
    console.error('Your server key starts with:', serverKey.substring(0, 15));
    console.warn('Midtrans Snap NOT initialized - use sandbox keys or set MIDTRANS_IS_PRODUCTION=true');
  } else if (isProduction && isServerKeySandbox) {
    console.error('ERROR: Production mode cannot use sandbox server key (SB-)');
    console.warn('Midtrans Snap NOT initialized - key mismatch');
  } else {
    snap = new midtransClient.Snap({
      isProduction: isProduction,
      serverKey: serverKey,
      clientKey: clientKey
    });
    console.log('Midtrans Snap initialized successfully');
    console.log('Mode:', isProduction ? 'PRODUCTION' : 'SANDBOX');
  }
} else {
  console.warn('Midtrans not configured - MIDTRANS_SERVER_KEY or MIDTRANS_CLIENT_KEY missing');
}
console.log('====================================');


// ============ ADMIN API ENDPOINTS ============

// Admin login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    res.json({ success: true, message: 'Login successful' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// Upload image endpoint
app.post('/api/admin/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    // Use environment variable for base URL in production
    const baseUrl = process.env.BACKEND_URL || `http://localhost:${PORT}`;
    const imageUrl = `${baseUrl}/uploads/${req.file.filename}`;
    res.json({ success: true, url: imageUrl });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get dashboard statistics
app.get('/api/admin/stats', async (req, res) => {
  try {
    const [totalOrders] = await db.query('SELECT COUNT(*) as count FROM orders');
    const [todayOrders] = await db.query('SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = CURDATE()');
    const [totalRevenue] = await db.query('SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE payment_status = "success"');
    const [todayRevenue] = await db.query('SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE payment_status = "success" AND DATE(created_at) = CURDATE()');
    const [pendingOrders] = await db.query('SELECT COUNT(*) as count FROM orders WHERE status IN ("menunggu", "sedang-dibuat")');
    const [menuItems] = await db.query('SELECT COUNT(*) as count FROM menu_items');

    res.json({
      success: true,
      data: {
        totalOrders: totalOrders[0].count,
        todayOrders: todayOrders[0].count,
        totalRevenue: totalRevenue[0].total,
        todayRevenue: todayRevenue[0].total,
        pendingOrders: pendingOrders[0].count,
        menuItems: menuItems[0].count
      }
    });
  } catch (error) {
    console.error('Stats Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all orders with optional filters (includes item counts and details)
app.get('/api/admin/orders', async (req, res) => {
  try {
    const { status, date, limit = 50 } = req.query;
    let query = `
      SELECT o.*, 
        COALESCE(SUM(oi.quantity), 0) as item_count,
        GROUP_CONCAT(CONCAT(oi.quantity, 'x ', oi.item_name) SEPARATOR ', ') as item_details
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
    `;
    const params = [];
    const conditions = [];

    if (status) {
      conditions.push('o.status = ?');
      params.push(status);
    }
    if (date) {
      conditions.push('DATE(o.created_at) = ?');
      params.push(date);
    }
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' GROUP BY o.id ORDER BY o.created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const [orders] = await db.query(query, params);
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Orders Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single order with items
app.get('/api/admin/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [orders] = await db.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [id]);
    res.json({ success: true, data: { ...orders[0], items } });
  } catch (error) {
    console.error('Order Detail Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create new order
app.post('/api/admin/orders', async (req, res) => {
  try {
    const { customer_name, customer_email, customer_phone, table_number, order_type, notes, items } = req.body;
    
    const [countResult] = await db.query('SELECT COUNT(*) as count FROM orders');
    const orderNumber = `#${String(countResult[0].count + 1).padStart(4, '0')}`;
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const [result] = await db.query(
      'INSERT INTO orders (order_number, customer_name, customer_email, customer_phone, table_number, order_type, notes, total_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [orderNumber, customer_name, customer_email, customer_phone, table_number, order_type || 'dine-in', notes, totalAmount]
    );

    const orderId = result.insertId;
    for (const item of items) {
      await db.query(
        'INSERT INTO order_items (order_id, menu_item_id, item_name, variant, quantity, price, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [orderId, item.menu_item_id || null, item.item_name, item.variant || null, item.quantity, item.price, item.price * item.quantity]
      );
    }

    res.json({ success: true, data: { id: orderId, order_number: orderNumber } });
  } catch (error) {
    console.error('Create Order Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update order status
app.patch('/api/admin/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
    res.json({ success: true, message: 'Order status updated' });
  } catch (error) {
    console.error('Update Status Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete order
app.delete('/api/admin/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM orders WHERE id = ?', [id]);
    res.json({ success: true, message: 'Order deleted' });
  } catch (error) {
    console.error('Delete Order Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all menu items
app.get('/api/admin/menu', async (req, res) => {
  try {
    const [items] = await db.query('SELECT * FROM menu_items ORDER BY category, name');
    res.json({ success: true, data: items });
  } catch (error) {
    console.error('Menu Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create menu item
app.post('/api/admin/menu', async (req, res) => {
  try {
    const { name, description, category, price, image_url, rating } = req.body;
    const [result] = await db.query(
      'INSERT INTO menu_items (name, description, category, price, image_url, rating) VALUES (?, ?, ?, ?, ?, ?)',
      [name, description, category, price, image_url, rating || 0]
    );
    res.json({ success: true, data: { id: result.insertId } });
  } catch (error) {
    console.error('Create Menu Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update menu item
app.put('/api/admin/menu/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, price, image_url, rating, is_available } = req.body;
    await db.query(
      'UPDATE menu_items SET name = ?, description = ?, category = ?, price = ?, image_url = ?, rating = ?, is_available = ? WHERE id = ?',
      [name, description, category, price, image_url, rating, is_available, id]
    );
    res.json({ success: true, message: 'Menu item updated' });
  } catch (error) {
    console.error('Update Menu Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete menu item
app.delete('/api/admin/menu/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM menu_items WHERE id = ?', [id]);
    res.json({ success: true, message: 'Menu item deleted' });
  } catch (error) {
    console.error('Delete Menu Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ MENU VARIANTS API ============

// Get variants for a menu item
app.get('/api/admin/menu/:id/variants', async (req, res) => {
  try {
    const { id } = req.params;
    const [groups] = await db.query(
      'SELECT * FROM menu_variant_groups WHERE menu_item_id = ? ORDER BY id',
      [id]
    );
    
    for (const group of groups) {
      const [options] = await db.query(
        'SELECT * FROM menu_variant_options WHERE variant_group_id = ? ORDER BY id',
        [group.id]
      );
      group.options = options;
    }
    
    res.json({ success: true, data: groups });
  } catch (error) {
    console.error('Get Variants Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Save variants for a menu item (replace all)
app.post('/api/admin/menu/:id/variants', async (req, res) => {
  try {
    const { id } = req.params;
    const { variants } = req.body;
    
    // Delete existing variants
    await db.query('DELETE FROM menu_variant_groups WHERE menu_item_id = ?', [id]);
    
    // Insert new variants
    for (const group of variants) {
      const [groupResult] = await db.query(
        'INSERT INTO menu_variant_groups (menu_item_id, name, is_required, max_select) VALUES (?, ?, ?, ?)',
        [id, group.name, group.is_required || false, group.max_select || 1]
      );
      const groupId = groupResult.insertId;
      
      for (const option of group.options || []) {
        await db.query(
          'INSERT INTO menu_variant_options (variant_group_id, name, extra_price, is_available) VALUES (?, ?, ?, ?)',
          [groupId, option.name, option.extra_price || 0, option.is_available !== false]
        );
      }
    }
    
    res.json({ success: true, message: 'Variants saved' });
  } catch (error) {
    console.error('Save Variants Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ END MENU VARIANTS API ============

// ============ RATING API ============

// Submit rating for a menu item
app.post('/api/menu/:id/rating', async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, order_id, comment } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    // Insert rating with comment
    await db.query(
      'INSERT INTO menu_ratings (menu_item_id, order_id, rating, comment) VALUES (?, ?, ?, ?)',
      [id, order_id || null, rating, comment || null]
    );

    // Calculate new average rating and count
    const [avgResult] = await db.query(
      'SELECT AVG(rating) as avg_rating, COUNT(*) as rating_count FROM menu_ratings WHERE menu_item_id = ?',
      [id]
    );

    const avgRating = avgResult[0].avg_rating ? parseFloat(avgResult[0].avg_rating).toFixed(1) : 0;
    const ratingCount = avgResult[0].rating_count || 0;

    // Update menu item rating_avg and rating_count
    await db.query(
      'UPDATE menu_items SET rating = ?, rating_avg = ?, rating_count = ? WHERE id = ?',
      [avgRating, avgRating, ratingCount, id]
    );

    res.json({ success: true, newRating: avgRating, ratingCount });
  } catch (error) {
    console.error('Submit Rating Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get ratings for a menu item
app.get('/api/menu/:id/rating', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [ratings] = await db.query(
      'SELECT AVG(rating) as avg_rating, COUNT(*) as total_ratings FROM menu_ratings WHERE menu_item_id = ?',
      [id]
    );

    res.json({
      success: true,
      data: {
        avgRating: ratings[0].avg_rating ? parseFloat(ratings[0].avg_rating).toFixed(1) : 0,
        totalRatings: ratings[0].total_ratings || 0
      }
    });
  } catch (error) {
    console.error('Get Rating Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ END RATING API ============

// Get monthly order report
app.get('/api/admin/reports/monthly', async (req, res) => {
  try {
    const { year } = req.query;
    const targetYear = year || new Date().getFullYear();

    const [report] = await db.query(`
      SELECT 
        MONTH(created_at) as month,
        COUNT(*) as total_orders,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        SUM(CASE WHEN status = 'selesai' THEN 1 ELSE 0 END) as completed_orders
      FROM orders
      WHERE YEAR(created_at) = ?
      GROUP BY MONTH(created_at)
      ORDER BY month ASC
    `, [targetYear]);

    res.json({ success: true, data: report, year: targetYear });
  } catch (error) {
    console.error('Monthly Report Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ END ADMIN API ============

// ============ PUBLIC MENU API (for user/customer view) ============

// Get all available menu items for customers (with variants)
// ============ PUBLIC MENU API (for user/customer view) ============

app.get('/api/menu', async (req, res) => {
  try {
    const { category } = req.query;

    let query = 'SELECT * FROM menu_items WHERE is_available = 1';
    const params = [];

    if (category) {
      query += ' AND LOWER(category) = ?';
      params.push(category.toLowerCase());
    }

    query += ' ORDER BY category, name';

    const [items] = await db.query(query, params);

    // Fetch variants for each menu item
    for (const item of items) {
      const [groups] = await db.query(
        'SELECT * FROM menu_variant_groups WHERE menu_item_id = ? ORDER BY id',
        [item.id]
      );

      for (const group of groups) {
        const [options] = await db.query(
          'SELECT * FROM menu_variant_options WHERE variant_group_id = ? AND is_available = 1 ORDER BY id',
          [group.id]
        );
        group.options = options;
      }

      item.variants = groups;
    }

    res.json({
      success: true,
      data: items
    });
  } catch (error) {
    console.error('❌ Public Menu Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============ USER ORDER API ============

// Create order from user (customer flow)
app.post('/api/orders', async (req, res) => {
  try {
    const { customer_name, customer_email, customer_phone, table_number, order_type, notes, items, payment_status } = req.body;
    
    const [countResult] = await db.query('SELECT COUNT(*) as count FROM orders');
    const orderNumber = `#${String(countResult[0].count + 1).padStart(4, '0')}`;
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const [result] = await db.query(
      'INSERT INTO orders (order_number, customer_name, customer_email, customer_phone, table_number, order_type, notes, total_amount, payment_status, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [orderNumber, customer_name || 'Guest', customer_email, customer_phone, table_number, order_type || 'dine-in', notes, totalAmount, payment_status || 'cash', 'menunggu']
    );

    const orderId = result.insertId;
    for (const item of items) {
      await db.query(
        'INSERT INTO order_items (order_id, menu_item_id, item_name, variant, quantity, price, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [orderId, item.menu_item_id || null, item.item_name, item.variant || null, item.quantity, item.price, item.price * item.quantity]
      );
    }

    res.json({ success: true, data: { id: orderId, order_number: orderNumber } });
  } catch (error) {
    console.error('Create User Order Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get orders for user (by table_number or order_type)
app.get('/api/orders', async (req, res) => {
  try {
    const { table_number, order_type } = req.query;

    let query = `
      SELECT o.*,
        COALESCE(SUM(oi.quantity), 0) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
    `;
    const params = [];
    const conditions = [];

    if (table_number) {
      conditions.push('o.table_number = ?');
      params.push(table_number);
    }

    if (order_type) {
      conditions.push('o.order_type = ?');
      params.push(order_type);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' GROUP BY o.id ORDER BY o.created_at DESC';

    const [orders] = await db.query(query, params);

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Get User Orders Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ END USER ORDER API ============

app.post('/api/create-transaction', async (req, res) => {
  try {
    const { orderId, grossAmount, customerDetails, itemDetails, paymentMethod } = req.body;

    // Block QRIS payment when Midtrans is not configured
    if (!snap) {
      if (paymentMethod === 'qris') {
        return res.status(503).json({ 
          success: false, 
          message: 'QRIS payment tidak tersedia. Midtrans belum dikonfigurasi. Silakan gunakan pembayaran Cash.'
        });
      }
      return res.status(503).json({ 
        success: false, 
        message: 'Payment system not configured. Check MIDTRANS_SERVER_KEY and MIDTRANS_CLIENT_KEY in server/.env'
      });
    }

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmount
      },
      customer_details: {
        first_name: customerDetails.firstName,
        last_name: customerDetails.lastName || '',
        email: customerDetails.email || 'customer@example.com',
        phone: customerDetails.phone || ''
      },
      item_details: itemDetails,
      callbacks: {
        finish: process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/payment-finish` : 'http://localhost:5173/payment-finish'
      }
    };

    // Force QRIS-only when paymentMethod is 'qris'
    if (paymentMethod === 'qris') {
      parameter.enabled_payments = ['other_qris'];
    }

    console.log('Creating Midtrans transaction for order:', orderId);
    const transaction = await snap.createTransaction(parameter);
    console.log('Transaction created successfully, token:', transaction.token ? 'OK' : 'MISSING');
    
    res.json({
      success: true,
      token: transaction.token,
      redirectUrl: transaction.redirect_url
    });
  } catch (error) {
    console.error('Midtrans Error:', error.message);
    
    // Provide clearer error messages
    let userMessage = error.message;
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      userMessage = 'Midtrans authentication failed. Pastikan MIDTRANS_SERVER_KEY dan MIDTRANS_CLIENT_KEY di .env adalah sandbox keys (SB-Mid-server-xxx dan SB-Mid-client-xxx).';
    }
    
    res.status(500).json({
      success: false,
      message: userMessage
    });
  }
});

app.post('/api/payment-notification', async (req, res) => {
  const notification = req.body;
  const receivedAt = new Date().toISOString();
  
  // Always respond 200 first to acknowledge receipt (prevents retry loop)
  res.status(200).json({ success: true });

  try {
    // Log full notification payload for debugging
    console.log('\n=== MIDTRANS NOTIFICATION RECEIVED ===');
    console.log('Time:', receivedAt);
    console.log('Order ID:', notification.order_id);
    console.log('Transaction ID:', notification.transaction_id);
    console.log('Transaction Status:', notification.transaction_status);
    console.log('Fraud Status:', notification.fraud_status);
    console.log('Payment Type:', notification.payment_type);
    console.log('Gross Amount:', notification.gross_amount);
    console.log('Full Payload:', JSON.stringify(notification, null, 2));
    console.log('======================================\n');

    const orderId = notification.order_id;
    const transactionId = notification.transaction_id;
    const transactionStatus = notification.transaction_status;
    const fraudStatus = notification.fraud_status;
    const paymentType = notification.payment_type;
    const grossAmount = notification.gross_amount;

    // Step 1: Verify notification authenticity using Midtrans SDK
    if (snap) {
      try {
        const statusResponse = await snap.transaction.notification(notification);
        console.log('Midtrans verification SUCCESS:', statusResponse.transaction_status);
      } catch (verifyError) {
        console.error('Midtrans verification FAILED:', verifyError.message);
        // In production, you may want to reject unverified notifications
        // For sandbox, we continue processing
      }
    }

    // Step 2: Check if order exists and get current status (idempotency check)
    const orderNumberVariants = [
      orderId,
      `#${orderId.replace('#', '')}`,
      orderId.replace('#', '')
    ];
    
    const [existingOrders] = await db.query(
      'SELECT id, order_number, payment_status, status FROM orders WHERE order_number IN (?, ?, ?) OR id = ?',
      [...orderNumberVariants, parseInt(orderId) || 0]
    );

    if (existingOrders.length === 0) {
      console.error('ORDER NOT FOUND for order_id:', orderId);
      return;
    }

    const order = existingOrders[0];
    console.log('Found order:', { id: order.id, order_number: order.order_number, current_status: order.payment_status });

    // Step 3: Idempotency - skip if already processed to final state
    if (order.payment_status === 'success' && transactionStatus !== 'refund') {
      console.log('Order already marked as success, skipping duplicate notification');
      return;
    }

    // Step 4: Determine new payment_status and order status
    let paymentStatus = order.payment_status; // Keep current by default
    let orderStatus = null;

    switch (transactionStatus) {
      case 'capture':
        // Credit card: check fraud status
        if (fraudStatus === 'accept') {
          paymentStatus = 'success';
          orderStatus = 'menunggu';
        } else if (fraudStatus === 'challenge') {
          paymentStatus = 'pending';
        } else if (fraudStatus === 'deny') {
          paymentStatus = 'failed';
          orderStatus = 'dibatalkan';
        }
        break;
        
      case 'settlement':
        // Final success for all payment types
        paymentStatus = 'success';
        orderStatus = 'menunggu';
        break;
        
      case 'pending':
        paymentStatus = 'pending';
        break;
        
      case 'deny':
        paymentStatus = 'failed';
        orderStatus = 'dibatalkan';
        break;
        
      case 'cancel':
        paymentStatus = 'failed';
        orderStatus = 'dibatalkan';
        break;
        
      case 'expire':
        paymentStatus = 'failed';
        orderStatus = 'dibatalkan';
        break;
        
      case 'refund':
      case 'partial_refund':
        paymentStatus = 'refunded';
        break;
        
      default:
        console.warn('Unknown transaction_status:', transactionStatus);
    }

    // Step 5: Update database
    let updateQuery = 'UPDATE orders SET payment_status = ?, updated_at = NOW()';
    let params = [paymentStatus];

    if (orderStatus) {
      updateQuery += ', status = ?';
      params.push(orderStatus);
    }

    updateQuery += ' WHERE id = ?';
    params.push(order.id);

    const [updateResult] = await db.query(updateQuery, params);

    console.log('=== DATABASE UPDATE COMPLETE ===');
    console.log('Order ID:', order.id);
    console.log('Order Number:', order.order_number);
    console.log('Payment Status:', order.payment_status, '->', paymentStatus);
    console.log('Order Status:', orderStatus ? `updated to ${orderStatus}` : 'unchanged');
    console.log('Affected Rows:', updateResult.affectedRows);
    console.log('================================\n');

  } catch (err) {
    console.error('PAYMENT NOTIFICATION ERROR:', err);
    console.error('Stack:', err.stack);
  }
});

app.get('/api/transaction-status/:orderId', async (req, res) => {
  try {
    if (!snap) {
      return res.status(503).json({ 
        success: false, 
        message: 'Midtrans not configured' 
      });
    }
    const { orderId } = req.params;
    const status = await snap.transaction.status(orderId);
    res.json({ success: true, status });
  } catch (error) {
    console.error('Status Check Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/client-key', (req, res) => {
  res.json({ clientKey: process.env.MIDTRANS_CLIENT_KEY });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Midtrans Mode: ${process.env.MIDTRANS_IS_PRODUCTION === 'true' ? 'Production' : 'Sandbox'}`);
});
