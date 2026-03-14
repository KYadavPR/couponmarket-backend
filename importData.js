const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const User = require('./models/User');
const Coupon = require('./models/Coupon');
const Order = require('./models/Order');
const Cart = require('./models/Cart');
const Reward = require('./models/Reward');
const Transaction = require('./models/Transaction');

const importData = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error('MONGO_URI is not defined in .env');
        }

        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB for data import...');

        const dataPath = path.join(__dirname, '../mongo_data_export.json');
        const rawData = fs.readFileSync(dataPath, 'utf-8');
        const data = JSON.parse(rawData);

        // Sequence of operations: clear then insert
        const models = [
            { name: 'User', model: User, data: data.User },
            { name: 'Coupon', model: Coupon, data: data.Coupon },
            { name: 'Order', model: Order, data: data.Order },
            { name: 'Cart', model: Cart, data: data.Cart },
            { name: 'Reward', model: Reward, data: data.Reward },
            { name: 'Transaction', model: Transaction, data: data.Transaction }
        ];

        for (const item of models) {
            if (item.data && item.data.length > 0) {
                console.log(`Cleaning and importing ${item.name} collection...`);
                await item.model.deleteMany({});
                await item.model.insertMany(item.data);
                console.log(`Successfully imported ${item.data.length} ${item.name} records.`);
            } else {
                console.log(`No data found for ${item.name}, skipping.`);
            }
        }

        console.log('Data import completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error importing data:', error);
        process.exit(1);
    }
};

importData();
