const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Booking = require('../models/bookingModel');
const Tour = require('../models/tourModel');

const catchAsync = require('../utils/catchAsync');
const {
    createOne,
    getOne,
    getAll,
    updateOne,
    deleteOne,
} = require('./handlerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
    // 1) Get currently booked tour
    const tour = await Tour.findById(req.params.tourId);

    // 2) Create checkout session
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        success_url: `${req.protocol}://${req.get('host')}?tour=${
            req.params.tourId
        }&user=${req.user._id}&price=${tour.price}`,
        cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
        customer_email: req.user.email,
        client_reference_id: req.params.tourId,
        line_items: [
            {
                price_data: {
                    currency: 'usd',
                    unit_amount: tour.price * 100, // convert to cents
                    product_data: {
                        name: `${tour.name} Tour`,
                        description: tour.summary,
                        images: [
                            `https://natours.dev/img/tours/${tour.imageCover}`,
                        ],
                    },
                },
                quantity: 1,
            },
        ],
    });

    // 3) Send session as response
    res.status(200).json({
        status: 'success',
        session,
    });
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
    const { tour, user, price } = req.query;

    if (!tour && !user && !price) return next();

    await Booking.create({ tour, user, price });
    res.redirect(`/`);
});

exports.createBooking = createOne(Booking);
exports.getBooking = getOne(Booking);
exports.getAllBookings = getAll(Booking);
exports.updateBooking = updateOne(Booking);
exports.deleteBooking = deleteOne(Booking);
