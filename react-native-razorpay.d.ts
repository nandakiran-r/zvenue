declare module 'react-native-razorpay' {
  interface RazorpayOptions {
    description: string;
    image: string;
    currency: string;
    key: string;
    amount: number;
    order_id: string;
    name: string;
    prefill: {
      email?: string;
      contact?: string;
      name?: string;
    };
    theme: {
      color: string;
    };
    modal?: {
      confirm_close?: boolean;
      back_button_close?: boolean;
      escape_exit?: boolean;
    };
  }

  interface RazorpayPaymentData {
    orderId: string;
    paymentId: string;
    signature: string;
    razorpay_payment_id?: string;
    razorpay_order_id?: string;
    razorpay_signature?: string;
  }

  interface RazorpayError {
    code: number;
    description: string;
    localizedDescription?: string;
  }

  const Razorpay: {
    open(options: RazorpayOptions): Promise<RazorpayPaymentData>;
  };

  export default Razorpay;
}
