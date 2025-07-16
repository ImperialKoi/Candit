import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

export default function TestPayPal() {
  return (
    <div style={{ padding: 40 }}>
      <PayPalScriptProvider options={{ clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "", currency: "USD", components: "buttons" }}>
        <PayPalButtons
          createOrder={(data, actions) => {
            if (!actions.order) return Promise.reject("PayPal actions.order is undefined");
            return actions.order.create({
              intent: "CAPTURE",
              purchase_units: [
                {
                  amount: { value: "1.00", currency_code: "USD" },
                  description: "Test",
                },
              ],
            });
          }}
          onApprove={async (data, actions) => {
            if (!actions.order) return;
            await actions.order.capture();
          }}
        />
      </PayPalScriptProvider>
    </div>
  );
}