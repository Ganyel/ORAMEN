import React from 'react';

const Invoice = React.forwardRef(({ order }, ref) => {
  return (
    <div ref={ref} style={{ padding: 20, fontFamily: 'Arial', width: '210mm' }}>
      <h2 style={{ textAlign: 'center' }}>ORAMEN</h2>
      <p style={{ textAlign: 'center' }}>Invoice / Receipt</p>

      <hr />

      <p><strong>Order Number:</strong> {order.order_number}</p>
      <p><strong>Date:</strong> {new Date(order.created_at).toLocaleString()}</p>
      <p><strong>Table:</strong> {order.table_number}</p>
      <p><strong>Payment:</strong> {order.payment_status}</p>

      <hr />

      <table width="100%" border="1" cellPadding="8" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, i) => (
            <tr key={i}>
              <td>{item.item_name}</td>
              <td>{item.quantity}</td>
              <td>Rp {item.price.toLocaleString()}</td>
              <td>Rp {(item.price * item.quantity).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 style={{ textAlign: 'right' }}>
        Total: Rp {order.total_amount.toLocaleString()}
      </h3>

      <p style={{ textAlign: 'center', marginTop: 30 }}>
        Thank you for your order 🍜
      </p>
    </div>
  );
});

export default Invoice;
