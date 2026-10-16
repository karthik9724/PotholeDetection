
require("dotenv").config({
    path: require("path").resolve(__dirname, "../../.env")
});

const bcrypt = require("bcryptjs");
const { connectDB, getDB, disconnectFromMongoDB } = require("../config/db");
const readline = require("readline");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function ask(question) {
    return new Promise((resolve) => {
        rl.question(question, resolve);
    });
}

async function createOfficer() {
    try {
        const name = (await ask("Officer name: ")).trim();
        const email = (await ask("Officer email: ")).trim().toLowerCase();
        const password = (await ask("Officer password (minimum 8 characters): "));

        if (!name || !email || password.length < 8) {
            throw new Error("Enter a name, email and password of at least 8 characters.");
        }

        await connectDB();

        const db = getDB();
        const users = db.collection("users");

        const existingUser = await users.findOne({ email });

        if (existingUser) {
            await users.updateOne(
                { _id: existingUser._id },
                {
                    $set: {
                        name,
                        role: "officer"
                    }
                }
            );

            console.log("Existing account promoted to officer.");
            console.log("Its current password has not been changed.");
        } else {
            const hashedPassword = await bcrypt.hash(password, 12);

            await users.insertOne({
                name,
                email,
                password: hashedPassword,
                role: "officer",
                createdAt: new Date()
            });

            console.log("Officer account created successfully.");
        }
    } catch (error) {
        console.error("Error:", error.message);
    } finally {
        rl.close();
        await disconnectFromMongoDB();
    }
}

createOfficer();
