const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const createTransaction = async (orderData, retries = 2) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(`${API_BASE_URL}/create-transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to create transaction');
      }
      
      return data;
    } catch (error) {
      console.error(`Create transaction error (attempt ${attempt + 1}):`, error);
      
      // Check for network timeout errors
      const isTimeoutError = error.name === 'AbortError' || 
        error.message?.includes('ETIMEDOUT') || 
        error.message?.includes('timeout') ||
        error.message?.includes('network');
      
      if (isTimeoutError && attempt < retries) {
        // Wait before retry (exponential backoff)
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      
      // Provide clear error message for network issues
      if (isTimeoutError) {
        throw new Error('Koneksi ke server pembayaran timeout. Periksa koneksi internet Anda dan coba lagi.');
      }
      
      throw error;
    }
  }
};

export const getTransactionStatus = async (orderId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/transaction-status/${orderId}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get transaction status error:', error);
    throw error;
  }
};

export const openSnapPopup = (token, callbacks = {}) => {
  return new Promise((resolve, reject) => {
    if (!window.snap || typeof window.snap.pay !== 'function') {
      reject(new Error('Midtrans Snap not loaded. Check if data-client-key in index.html is valid.'));
      return;
    }

    window.snap.pay(token, {
      onSuccess: (result) => {
        console.log('Payment success:', result);
        if (callbacks.onSuccess) callbacks.onSuccess(result);
        resolve({ status: 'success', result });
      },
      onPending: (result) => {
        console.log('Payment pending:', result);
        if (callbacks.onPending) callbacks.onPending(result);
        resolve({ status: 'pending', result });
      },
      onError: (result) => {
        console.log('Payment error:', result);
        if (callbacks.onError) callbacks.onError(result);
        reject({ status: 'error', result });
      },
      onClose: () => {
        console.log('Payment popup closed');
        if (callbacks.onClose) callbacks.onClose();
        resolve({ status: 'closed' });
      }
    });
  });
};

export const generateOrderId = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};
