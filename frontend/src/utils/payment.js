import apiClient from '../api/client';

/**
 * Ensures the Razorpay checkout script is loaded in the browser.
 */
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn('Could not load Razorpay CDN script (may be blocked by adblock or offline). Fallback modal available.');
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

/**
 * Initiates Razorpay payment or free enrollment for a course.
 */
export const processCourseEnrollment = async ({
  course,
  user,
  onOrderCreated,
  onSuccess,
  onError,
  onCancel,
}) => {
  try {
    // If course is free (price is 0 or null), use standard direct enrollment
    if (!course.price || course.price === 0) {
      const res = await apiClient.post(`/enrollments/courses/${course.id}`);
      onSuccess({
        isFree: true,
        message: 'Successfully enrolled in course!',
        ...res.data,
      });
      return;
    }

    // Step 1: Create Razorpay Order via Backend API
    const orderRes = await apiClient.post('/payments/create-order', {
      course_id: course.id,
    });
    const orderData = orderRes.data;

    if (onOrderCreated) {
      onOrderCreated(orderData);
    }

    // Step 2: Attempt standard Razorpay Checkout Modal
    const scriptLoaded = await loadRazorpayScript();

    if (scriptLoaded && window.Razorpay && !orderData.key_id.startsWith('rzp_test_studyhub')) {
      const options = {
        key: orderData.key_id,
        amount: orderData.amount_paise,
        currency: orderData.currency || 'INR',
        name: 'StudyHub Academic Platform',
        description: `Enrollment: ${course.title}`,
        order_id: orderData.order_id,
        prefill: {
          name: user?.full_name || '',
          email: user?.email || '',
        },
        config: {
          display: {
            blocks: {
              upi: {
                name: 'UPI / QR',
                instruments: [{ method: 'upi' }],
              },
              card: {
                name: 'Credit & Debit Cards',
                instruments: [{ method: 'card' }],
              },
              netbanking: {
                name: 'Netbanking',
                instruments: [{ method: 'netbanking' }],
              },
              wallet: {
                name: 'Wallets',
                instruments: [{ method: 'wallet' }],
              },
            },
            sequence: ['block.upi', 'block.card', 'block.netbanking', 'block.wallet'],
            preferences: {
              show_default_blocks: true,
            },
          },
        },
        theme: {
          color: '#4f46e5',
        },
        handler: async function (response) {
          try {
            const verifyRes = await apiClient.post('/payments/verify', {
              course_id: course.id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              payment_method: response.razorpay_payment_method || 'card',
              bank_or_vpa: response.razorpay_vpa || response.razorpay_bank || null,
            });
            onSuccess({
              isFree: false,
              ...verifyRes.data,
            });
          } catch (err) {
            onError(err.response?.data?.detail || 'Payment verification failed');
          }
        },
        modal: {
          ondismiss: function () {
            if (onCancel) onCancel();
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        onError(resp.error?.description || 'Payment was declined');
      });
      rzp.open();
    } else {
      // Step 3: Test / Sandbox fallback flow for demo keys & local development
      // We pass the orderData to caller so it can display the interactive simulated Razorpay dialog
      return {
        isSandbox: true,
        orderData,
      };
    }
  } catch (err) {
    console.error('Enrollment payment error:', err);
    onError(err.response?.data?.detail || err.message || 'Enrollment could not be processed');
  }
};
