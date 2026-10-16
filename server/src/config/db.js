
const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;

let client;
let db;

async function connectDB() {
    if (!uri) {
        throw new Error("MONGODB_URI is missing from .env");
    }

    client = new MongoClient(uri);

    await client.connect();

    db = client.db("pothole_detection");

    await db.collection("users").createIndex(
    { email: 1 },
    { unique: true }
);

    await db.command({ ping: 1 });

    console.log("You successfully connected to MongoDB!");

    return db;
}

function getDB() {
    if (!db) {
        throw new Error("Database is not connected");
    }

    return db;
}

async function disconnectFromMongoDB() {
    if (client) {
        await client.close();
        console.log("MongoDB connection closed");
    }
}

module.exports = {
    connectDB,
    getDB,
    disconnectFromMongoDB
};
