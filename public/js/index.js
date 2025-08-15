import '@babel/polyfill';
import { login, logout } from './login';
import { updateSettings } from './updateSettings';
import { bookTour } from './stripe';

// DOM ELEMENTS
const loginForm = document.querySelector('#login-form');
const updateDataForm = document.querySelector('#update-data-form');
const updatePasswordForm = document.querySelector('#update-password-form');
const logoutBtn = document.querySelector('.nav__el--logout');
const bookBtn = document.getElementById('book-tour');

// Values
const name = document.getElementById('name');
const email = document.getElementById('email');
const photo = document.getElementById('photo');
const password = document.getElementById('password');
const passwordCurrent = document.getElementById('password-current');
const passwordConfirm = document.getElementById('password-confirm');

if (loginForm)
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        login(email.value, password.value);
    });

if (logoutBtn) logoutBtn.addEventListener('click', () => logout());

if (updateDataForm)
    updateDataForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = new FormData();
        form.append('name', name.value);
        form.append('email', email.value);
        form.append('photo', photo.files[0]);

        updateSettings(form, 'data');
    });

if (updatePasswordForm)
    updatePasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await updateSettings(
            {
                passwordCurrent: passwordCurrent.value,
                password: password.value,
                passwordConfirm: passwordConfirm.value,
            },
            'password'
        );

        password.value = '';
        passwordCurrent.value = '';
        passwordConfirm.value = '';
    });

if (bookBtn)
    bookBtn.addEventListener('click', (e) => {
        e.target.textContent = 'Processing';
        const { tourId } = e.target.dataset;
        bookTour(tourId);
        // e.target.textContent = '';
    });
