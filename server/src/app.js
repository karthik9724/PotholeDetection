
const dns = require("node:dns");

// DNS configuration for Windows
dns.setServers(["8.8.8.8", "1.1.1.1"]);

require("dotenv").config();

const express = require("express");
const cors = require("cors");

const { connectDB } = require("./config/db");
const reportRoutes = require("./routes/reportRoutes");
const authRoutes = require("./routes/authRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Authentication routes
app.use("/api/auth", authRoutes);

// Home route
app.get("/", (req, res) => {
    res.send("Pothole Detection API is running!");
});

// Backend connection test
app.get("/api/test", (req, res) => {
    res.json({
        success: true,
        message: "Pothole Detection Backend Connected Successfully!"
    });
});

// Analytics route (MongoDB + Hadoop)
app.use("/api/analytics", analyticsRoutes);

// Pothole report routes
app.use("/api/reports", reportRoutes);

// Start server after connecting to MongoDB
async function startServer() {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Startup failed:", error.message);
        process.exitCode = 1;
    }
}

startServer();

