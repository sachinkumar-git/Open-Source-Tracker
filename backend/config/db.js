const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
    if (isConnected) {
        console.log('Using existing MongoDB connection');
        return;
    }

    try {
        let uri = process.env.MONGODB_URI;

        // Automatically start In-Memory MongoDB if local connection is requested and fails,
        // or just default to Memory Server for robust local testing:
        if (uri && (uri.includes('127.0.0.1') || uri.includes('localhost'))) {
            try {
                const { MongoMemoryServer } = require('mongodb-memory-server');
                const mongoServer = await MongoMemoryServer.create();
                uri = mongoServer.getUri();
                console.log('✅ Started In-Memory MongoDB Database for local development!');
            } catch (err) {
                console.log('⚠ Could not start memory server, attempting standard connection.');
            }
        }

        const conn = await mongoose.connect(uri);
        isConnected = conn.connections[0].readyState;
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ Error connecting to Database: ${error.message}`);
        console.log('\n💡 TIP: Please set a cloud MONGODB_URI in your .env file or ensure MongoDB is running locally.');
        process.exit(1);
    }
};

module.exports = connectDB;
