import axios from 'axios';
import { showAlert } from './alerts';

export const login = async (email, password) => {
    try {
        const res = await axios({
            method: 'POST',
            url: '/api/v1/users/login',
            data: {
                email,
                password,
            },
            withCredentials: true,
        });

        if (res.data.status === 'success') {
            showAlert('success', 'You logged in successfully');
            window.setTimeout(() => {
                location.assign('/');
            }, 1500);
        }
    } catch (error) {
        showAlert('error', error.response.data.message);
    }
};

export const logout = async () => {
    try {
        const res = await axios({
            method: 'GET',
            url: '/api/v1/users/logout',
        });

        if (res.data.status === 'success') {
            showAlert('success', 'Logout successfully')
            location.reload(true);
        }
    } catch (error) {
        showAlert('error', 'Error in logout. Please try again.');
    }
};
