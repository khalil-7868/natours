const express = require('express');
const router = express.Router();
const {
    getAllTours,
    createTour,
    getTour,
    updateTour,
    deleteTour,
    aliasTopTours,
    getTourStats,
    getMonthlyPlan,
    getToursWithin,
    getDistances,
    uploadTourImages,
    resizeTourImages,
} = require('../controllers/tourController');
const { protect, restrictTo } = require('../controllers/authController');
const { createReview } = require('../controllers/reviewController');
const reviewRouter = require('./reviewRoutes');

router.use('/:tourId/reviews', reviewRouter);

router
    .route('/')
    .get(getAllTours)
    .post(protect, restrictTo('admin', 'lead-guide'), createTour);
router.route('/top-5-cheap').get(aliasTopTours, getAllTours);
router
    .route('/monthly-plan/:year')
    .get(protect, restrictTo('admin', 'lead-guide', 'guide'), getMonthlyPlan);

// /tours-within/233/center/-40,45/unit/mi
router
    .route('/tours-within/:distance/center/:latlng/unit/:unit')
    .get(getToursWithin);

router.route('/distances/:latlng/unit/:unit').get(getDistances);

router.route('/tour-stats').get(getTourStats);
router
    .route('/:id')
    .get(getTour)
    .patch(
        protect,
        restrictTo('admin', 'lead-guide'),
        uploadTourImages,
        resizeTourImages,
        updateTour
    )
    .delete(protect, restrictTo('admin', 'lead-guide'), deleteTour);

router
    .route('/:tourId/reviews')
    .post(protect, restrictTo('user'), createReview);

module.exports = router;
