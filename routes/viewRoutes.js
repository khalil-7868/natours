const express = require('express');
const router = express.Router();

const {
    getOverview,
    getTour,
    getLoginForm,
    getAccount,
    getMyTours,
} = require('../controllers/viewsController');
const { isLoggedin, protect } = require('../controllers/authController');
const { createBookingCheckout } = require('../controllers/bookingController');

// router.get('/', (req, res) => {
//     res.status(200).render('base', {
//         tour: 'The Forest Hiker',
//         user: 'Jonas',
//     });
// });

router.get('/', createBookingCheckout, isLoggedin, getOverview);
router.get('/tour/:slug', isLoggedin, getTour);
router.get('/login', isLoggedin, getLoginForm);
router.get('/me', protect, getAccount);
router.get('/my-tours', protect, getMyTours);

module.exports = router;
