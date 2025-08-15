const express = require('express');
const router = express.Router();

const {
    getUser,
    updateUser,
    deleteUser,
    getAllUsers,
    createUser,
    updateMe,
    deleteMe,
    getMe,
    uploadUserPhoto,
    resizeUserPhoto,
} = require('../controllers/userController');

const {
    signup,
    login,
    forgotPassword,
    resetPassword,
    updatePassword,
    protect,
    restrictTo,
    logout,
} = require('../controllers/authController');

router.post('/signup', signup);
router.post('/login', login);
router.get('/logout', logout);
router.post('/forgotPassword', forgotPassword);
router.patch('/resetPassword/:token', resetPassword);

router.use(protect);
router.get('/me', getMe, getUser);
router.patch('/updateMyPassword', updatePassword);
router.patch('/updateMe', uploadUserPhoto, resizeUserPhoto, updateMe);
router.delete('/deleteMe', deleteMe);

router.use(restrictTo('admin'));
router.route('/').get(getAllUsers).post(createUser);
router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

module.exports = router;
