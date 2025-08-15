const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');
const crypto = require('crypto');

const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};

const createSignToken = (user, statusCode, res) => {
    const token = signToken(user._id);
    const cookieOptions = {
        maxAge: process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: true,
        sameSite: 'none',
    };

    res.cookie('jwt', token, cookieOptions);
    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user,
        },
    });
};

exports.logout = (req, res) => {
    res.clearCookie('jwt');

    res.status(200).json({ status: 'success' });
};

exports.signup = catchAsync(async (req, res, next) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        passwordChangedAt: req.body.passwordChangedAt,
        role: req.body.role,
    });

    const url = `${req.protocol}://${req.get('host')}/me`;
    

    await new Email(newUser, url).sendWelcome();

    createSignToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        next(new AppError('Please provide email and password', 400));
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('incorrect email or password', 401));
    }

    createSignToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
    let token;
    //     1) getting token and check if it's there
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer ')
    ) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    if (!token) {
        return next(
            new AppError('You are not logged in. Please login again', 401)
        );
    }

    //     2) Verification token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // console.log(decoded);

    //     3) Check if user still exists

    const currentUser = await User.findById(decoded.id);

    if (!currentUser) {
        return next(
            new AppError(
                'The user belonging to this token does no longer exist',
                401
            )
        );
    }

    //     4) Check if user changed the password after JWT token issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next(
            new AppError(
                'User changed his password recently, Please login again',
                401
            )
        );
    }

    res.locals.user = currentUser;
    req.user = currentUser;
    next();
});

exports.isLoggedin = catchAsync(async (req, res, next) => {
    if (req.cookies.jwt) {
        //     2) Verification token
        const decoded = await promisify(jwt.verify)(
            req.cookies.jwt,
            process.env.JWT_SECRET
        );

        //     3) Check if user still exists
        const currentUser = await User.findById(decoded.id);

        if (!currentUser) {
            return next();
        }

        //     4) Check if user changed the password after JWT token issued
        if (currentUser.changedPasswordAfter(decoded.iat)) {
            return next();
        }

        res.locals.user = currentUser;
        return next();
    }
    next();
});

exports.restrictTo = (...args) => {
    return (req, res, next) => {
        args.includes(req.user.role);
        if (!args.includes(req.user.role)) {
            return next(
                new AppError(
                    'You have no permission for this route. Please login as admin.',
                    403
                )
            );
        }
        next();
    };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
    // Get user based on Email
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
        return next(new AppError('Email is not exist.', 401));
    }

    // Generate Random token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    try {
        // Send token with email
        const resetURL = `${req.protocol}://${req.get(
            'host'
        )}/api/v1/users/resetPassword/${resetToken}`;
        await new Email(user, resetURL).sendPasswordReset();

        res.status(200).json({
            status: 'success',
            message: 'Token sent to email!',
        });
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
        console.log(err);

        return next(
            new AppError(
                'There was an error sending the email. Try again later!',
                500
            )
        );
    }
    // next();
});

exports.resetPassword = catchAsync(async (req, res, next) => {
    // 1) Get user based on the token
    const passwordResetToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');
    const user = await User.findOne({
        passwordResetToken,
        passwordResetExpires: { $gt: Date.now() },
    });

    // 2) If token has not expired, and there is user, set the new password
    if (!user) {
        return next(new AppError('Token is invalid or has expired', 400));
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // 3) Log the user in, send JWT
    createSignToken(user, 200, res);

    next();
});

exports.updatePassword = catchAsync(async (req, res, next) => {
    // 1) Get user from collection
    const user = await User.findById(req.user.id).select('+password');
    // console.log(user);

    // 2) Check if posted current password is correct
    const isPasswordTrue = await user.correctPassword(
        req.body.passwordCurrent,
        user.password
    );

    if (!isPasswordTrue) {
        return next(new AppError('Your current password is wrong.', 401));
    }

    // 3) If so update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;

    await user.save();

    // 4) Log user in, send JWT

    createSignToken(user, 200, res);
});
