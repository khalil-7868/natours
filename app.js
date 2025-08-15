const express = require('express');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const compression = require('compression')

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRoutes = require('./routes/viewRoutes');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();
const corsOrigin = {
    origin: 'http://localhost:3000',
    credentials: true,
    optionSuccessStatus: 200,
};

// Set pug
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Global Middleware

// Serving Static files
app.use(express.static(path.join(__dirname, 'public')));

// Set Security HTTP headers
app.use(
    helmet({
        contentSecurityPolicy: false,
    })
);

// Development Logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Limit requrest from same API
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Too manu requests from this IP, Please try again in an hour!',
});

app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter polution
app.use(
    hpp({
        whitelist: [
            'duration',
            'ratingsQuantity',
            'ratings',
            'maxGroupSize',
            'difficulty',
            'price',
        ],
    })
);

app.use(compression())

// Test middleware
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    // console.log(req.cookies);
    next();
});

app.use(cors(corsOrigin));

// Render Base template
app.use('/', viewRoutes);

// Routes
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => {
    next(new AppError(`This route ${req.originalUrl} is not defined yet`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
