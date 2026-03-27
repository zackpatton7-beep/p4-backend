const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // Allow your Antigravity website to talk to this server securely
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests allowed' });
  }

  try {
    const { amount, email, name, invoice_number } = req.body;

    // Stripe requires money to be counted in pennies (cents). 
    // This turns $500.00 into 50000 cents so Stripe understands it.
    const amountInCents = Math.round(parseFloat(amount) * 100);

    // Tell Stripe to create a "Payment Intent"
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      receipt_email: email, // Triggers the automated receipt to the customer
      description: `Invoice: ${invoice_number}`,
      metadata: {
        customer_name: name,
        invoice_number: invoice_number
      }
    });

    // Send the secret confirmation code back to your website
    res.status(200).json({ clientSecret: paymentIntent.client_secret });
    
  } catch (error) {
    console.error("Stripe Error:", error);
    res.status(500).json({ error: error.message });
  }
}