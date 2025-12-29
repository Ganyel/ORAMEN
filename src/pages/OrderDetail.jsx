import { useParams } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import html2pdf from 'html2pdf.js';
import Invoice from './Invoice';

const OrderDetail = () => {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState(null);
  const invoiceRef = useRef();

  useEffect(() => {
    fetch(`http://localhost:5000/api/admin/orders/${orderNumber}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setOrder(data.data);
        }
      });
  }, [orderNumber]);

  const downloadPDF = () => {
    html2pdf()
      .set({
        margin: 10,
        filename: `Invoice-${order.order_number}.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4' }
      })
      .from(invoiceRef.current)
      .save();
  };

  if (!order) return <p>Loading invoice...</p>;

  return (
    <>
      <Invoice ref={invoiceRef} order={order} />

      <button onClick={downloadPDF} style={{ marginTop: 20 }}>
        Download Invoice PDF
      </button>
    </>
  );
};

export default OrderDetail;
