const AppError = require('../utils/appError');

// Error Types
// 1) CastError
// 2) Mongoo Driver error 11000 code
// 3) Validation Error

const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}.`;
    return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    const message = `Duplicate field values: ${value}. Please use another value!`;
    return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map((val) => val.message);
    const message = `invalid input data: ${errors.join('. ')}`;
    return new AppError(message, 400);
};

const sendErrorDev = (err, req, res) => {
    if (req.originalUrl.startsWith('/api')) {
        return res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack,
        });
    }
    res.status(err.statusCode).render('error', {
        title: 'Something went wrong!',
        msg: err.message,
    });
};

const handleJWTError = () =>
    new AppError('JWT Error. Please login again.', 401);
const handleJWTExpiredError = () =>
    new AppError('Your token has expired. Please login again.', 401);

const sendErrorProd = (err, req, res) => {
    if (req.originalUrl.startsWith('/api')) {
        if (err.isOperational) {
            return res.status(err.statusCode).json({
                status: err.status,
                message: err.message,
            });
        }

        console.error('Error', err);
        res.status(500).json({
            status: 'error',
            message: 'Something went very wrong!',
        });
    }

    // Error in production
    if (err.isOperational) {
        return res.status(err.statusCode).render('error', {
            title: 'Something went wrong!',
            msg: err.message,
        });
    }

    console.error('Error', err);
    return res.status(err.statusCode).render('error', {
        title: 'something went wrong!',
        msg: 'Please try again later.',
    });
};

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, req, res);
    } else if (process.env.NODE_ENV === 'production') {
        let error = { ...err };
        error.message = err.message;

        if (error.name === 'CastError') error = handleCastErrorDB(error);
        if (error.code === 11000) error = handleDuplicateFieldsDB(error);
        if (error.name === 'ValidationError')
            error = handleValidationErrorDB(error);
        if (error.name === 'JsonWebTokenError') error = handleJWTError();
        if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

        sendErrorProd(error, req, res);
    }

    next();
};
