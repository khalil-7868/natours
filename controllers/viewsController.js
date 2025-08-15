const catchAsync = require('../utils/catchAsync');
const Tour = require('../models/tourModel');
const { login } = require('./authController');
const AppError = require('../utils/appError');
const Booking = require('../models/bookingModel');

exports.getOverview = catchAsync(async (req, res, next) => {
    // 1 Get tour data from collection
    const tours = await Tour.find();
    // 2 Build template
    // 3 Render template using tour data from step 1
    res.status(200).render('overview', {
        title: 'All Tours',
        tours,
    });
});

exports.getTour = catchAsync(async (req, res, next) => {
    const requiredTour = req.params.slug;
    const tour = await Tour.findOne({ slug: requiredTour }).populate({
        path: 'reviews',
        fields: 'review rating user',
    });

    if (!tour)
        return next(new AppError('There is no tour with that name.', 404));

    res.status(200).render('tour', {
        title: `${tour.name} Tour`,
        tour,
    });
});

exports.getLoginForm = catchAsync(async (req, res, next) => {
    res.status(200).render('login', {
        title: 'Login',
    });
});

exports.getAccount = (req, res) => {
    res.status(200).render('account', {
        title: 'Your account',
    });
};

exports.getMyTours = catchAsync(async (req, res, next) => {
    const bookings = await Booking.find({ user: req.user.id });

    const tourIds = bookings.map((el) => el.tour);
    const tours = await Tour.find({ _id: { $in: tourIds } });
    res.status(200).render('overview', {
        title: 'My Booked Tours',
        tours,
    });
});
