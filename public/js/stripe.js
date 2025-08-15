import { loadStripe } from '@stripe/stripe-js';
import axios from 'axios';
import { showAlert } from './alerts';

export const bookTour = async (tourId) => {
    try {
        // 1) Initialize Stripe
        const stripe = await loadStripe(
            'pk_test_51RvcgVAqm1XuokYNPupGEPDIJJHDTUaLhgSGndeOU53DRcIe429ylbl7RYZYLOgDeznGbtAwT4VAd9OLiBxabUm600BxxfPhg4'
        );

        // 2) Get checkout session from API
        const session = await axios(
            `/api/v1/bookings/checkout-session/${tourId}`
        );

        // 3) Create checkout form + charge credit card
        const result = await stripe.redirectToCheckout({
            sessionId: session.data.session.id,
        });

        if (result.error) {
            showAlert('error', result.error.message);
        }
    } catch (err) {
        showAlert('error', err.message || 'Something went wrong!');
    }
};
