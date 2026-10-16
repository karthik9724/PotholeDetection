
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getDB } = require("../config/db");

const router = express.Router();

function createToken(user) {
    return jwt.sign(
        {
            userId: user._id.toString(),
            email: user.email,
            role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
    );
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string" ||
            !name.trim() ||
            !email.trim() ||
            password.length < 8
        ) {
            return res.status(400).json({
                success: false,
                message: "Enter your name, a valid email and a password of at least 8 characters."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const db = getDB();
        const users = db.collection("users");

        const existingUser = await users.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = {
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role: "citizen",
            createdAt: new Date()
        };

        const result = await users.insertOne(user);

        const savedUser = {
            _id: result.insertedId,
            name: user.name,
            email: user.email,
            role: user.role
        };

        return res.status(201).json({
            success: true,
            message: "Registration successful.",
            token: createToken(savedUser),
            user: savedUser
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists."
            });
        }

        console.error("Registration error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Registration failed."
        });
    }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required."
            });
        }

        const db = getDB();
        const user = await db.collection("users").findOne({
            email: email.trim().toLowerCase()
        });

        if (
            !user ||
            !(await bcrypt.compare(password, user.password))
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const safeUser = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        };

        return res.json({
            success: true,
            message: "Login successful.",
            token: createToken(safeUser),
            user: safeUser
        });
    } catch (error) {
        console.error("Login error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Login failed."
        });
    }
});

module.exports = router;
