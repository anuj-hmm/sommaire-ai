import { isDev } from "./helpers";

export const pricingPlans = [
  {
    name: 'Basic',
    price: 9,
    description: 'Perfect for occasional use',
    id: 'basic',
    items: ['5 PDF summaries per month'],
    paymentLink: isDev
    ? 'https://buy.stripe.com/test_28E14pefW5ZKfU6dgQfrW00'
    :'',
    priceId: isDev
    ?'price_1RqF7dPNW4qbkmbmrpHXrLvr': '',
  },
  {
    name: 'Pro',
    price: 19,
    description: 'For professionals and teams',
    items: [
      'Unlimited PDF summaries',
      'Priority processing',
      '24/7 priority support',
      'Markdown Export',
    ],
    id: 'pro',
    paymentLink: isDev
    ? 'https://buy.stripe.com/test_eVqaEZ8VC87S9vI7WwfrW01'
    :'',
    priceID: isDev
    ?'price_1RqF7dPNW4qbkmbmZEUaWmhS': '',
  },
];