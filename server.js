const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
    process.exit(1);
});

dotenv.config({
    path: './.env',
});
const app = require('./app');

const db = process.env.DATABASE.replace(
    '<PASSWORD>',
    process.env.DATABASE_PASSWORD
);

mongoose
    .connect(db)
    .then(() => console.log('Database connected successfully'))
    .catch((err) => console.error('Database connection error:', err));

const port = process.env.PORT || 5000;
const server = app.listen(port, () => {
    console.log('Server Started on port ' + port + '...');
});

process.on('unhandledRejection', (err) => {
    server.close(() => process.exit(1));
});
