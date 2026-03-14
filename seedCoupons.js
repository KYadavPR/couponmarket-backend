const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const Coupon = require('./models/Coupon');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/coupon-market');
        console.log('MongoDB connected for seeding');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
};

const seedCoupons = async () => {
    await connectDB();

    try {
        // Ensure the default user exists to own the seeded coupons
        let defaultUser = await User.findOne({ email: 'karthikyadav1800@gmail.com' });
        if (!defaultUser) {
            const hashedPassword = await bcrypt.hash('Karthik@123', 10);
            defaultUser = new User({
                email: 'karthikyadav1800@gmail.com',
                password: hashedPassword,
                name: 'Karthik Yadav',
                role: 'ADMIN'
            });
            await defaultUser.save();
            console.log('Created default user: karthikyadav1800@gmail.com');
        } else {
            console.log('Default user already exists: karthikyadav1800@gmail.com');
        }

        // Read the coupons.json file
        const jsonPath = path.join(__dirname, '../frontend/src/data/coupons.json');
        const couponsData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

        let inserted = 0;
        let skipped = 0;

        for (const item of couponsData) {
            const existingCoupon = await Coupon.findOne({ code: item.code.trim().toUpperCase() });

            if (existingCoupon) {
                skipped++;
                continue;
            }

            const coupon = new Coupon({
                title: item.title,
                description: item.description,
                store: item.store,
                brand: item.store, // mapping store to brand as JSON lacks brand
                code: item.code.trim().toUpperCase(),
                category: item.category || 'All',
                discount: item.discount,
                price: item.price || 0,
                expiryDate: new Date(item.expiry),
                userId: defaultUser._id,
                verified: true, // Seeded coupons are verified
                status: 'AVAILABLE'
            });

            await coupon.save();
            inserted++;
        }

        console.log(`Seeding complete! Inserted: ${inserted}, Skipped (duplicates): ${skipped}`);
        process.exit(0);

    } catch (error) {
        console.error('Error during seeding:', error);
        process.exit(1);
    }
};

seedCoupons();
