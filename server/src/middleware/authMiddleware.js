
const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Please log in to continue."
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired login session."
        });
    }
}

function officerOnly(req, res, next) {
    if (req.user.role !== "officer") {
        return res.status(403).json({
            success: false,
            message: "Only officers can update repair details."
        });
    }

    next();
}

function citizenOnly(req, res, next) {
    if (req.user.role !== "citizen") {
        return res.status(403).json({
            success: false,
            message: "Only citizens can submit pothole reports."
        });
    }

    next();
}

module.exports = {
    authenticateToken,
    officerOnly,
    citizenOnly
};
