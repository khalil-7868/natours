const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Review = require('./models/reviewModel');
const Tour = require('./models/tourModel');
const User = require('./models/userModel');

dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE.replace(
    '<PASSWORD>',
    process.env.DATABASE_PASSWORD
);

mongoose.connect(DB).then(() => console.log('DB Connection successful'));

const reviews = JSON.parse(
    fs.readFileSync(`${__dirname}/dev-data/data/reviews.json`, 'utf-8')
);
const tours = JSON.parse(
    fs.readFileSync(`${__dirname}/dev-data/data/tours.json`, 'utf-8')
);
const users = JSON.parse(
    fs.readFileSync(`${__dirname}/dev-data/data/users.json`, 'utf-8')
);

const importData = async () => {
    try {
        await User.create(users, { validateBeforeSave: false });
        await Tour.create(tours);
        await Review.create(reviews);
        console.log('Data imported successfully.');
    } catch (err) {
        console.log(err);
    }
    process.exit();
};

const deleteData = async () => {
    try {
        await Review.deleteMany();
        await Tour.deleteMany();
        await User.deleteMany();
        console.log('Data deleted successfully.');
    } catch (err) {
        console.log(err);
    }

    process.exit();
};

if (process.argv[2] === '--import') {
    importData();
}

if (process.argv[2] === '--delete') {
    deleteData();
}
