
const express = require("express");
const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");

const {
    authenticateToken,
    officerOnly,
    citizenOnly
} = require("../middleware/authMiddleware");

const upload = require("../middleware/uploadMiddleware");

const {
    uploadImage,
    getImageUrl
} = require("../config/s3Upload");

const router = express.Router();

// Convert location input into a proper MongoDB object
function normalizeLocation(location) {
    let parsedLocation = location;

    // FormData sends objects as strings, so parse the JSON string
    if (typeof location === "string") {
        try {
            parsedLocation = JSON.parse(location);
        } catch {
            // Also support a plain-text address
            parsedLocation = { address: location };
        }
    }

    if (
        !parsedLocation ||
        typeof parsedLocation !== "object" ||
        Array.isArray(parsedLocation)
    ) {
        throw new Error("Location must contain a valid address.");
    }

    if (
        typeof parsedLocation.address !== "string" ||
        !parsedLocation.address.trim()
    ) {
        throw new Error("A valid location address is required.");
    }

    const normalized = {
        address: parsedLocation.address.trim()
    };

    const hasLatitude =
        parsedLocation.latitude !== undefined &&
        parsedLocation.latitude !== null &&
        parsedLocation.latitude !== "";

    const hasLongitude =
        parsedLocation.longitude !== undefined &&
        parsedLocation.longitude !== null &&
        parsedLocation.longitude !== "";

    // GPS coordinates must be provided together
    if (hasLatitude !== hasLongitude) {
        throw new Error(
            "Both latitude and longitude must be provided together."
        );
    }

    if (hasLatitude && hasLongitude) {
        const latitude = Number(parsedLocation.latitude);
        const longitude = Number(parsedLocation.longitude);

        if (
            !Number.isFinite(latitude) ||
            latitude < -90 ||
            latitude > 90
        ) {
            throw new Error("Latitude must be between -90 and 90.");
        }

        if (
            !Number.isFinite(longitude) ||
            longitude < -180 ||
            longitude > 180
        ) {
            throw new Error("Longitude must be between -180 and 180.");
        }

        normalized.latitude = latitude;
        normalized.longitude = longitude;
    }

    return normalized;
}

// POST: Only logged-in citizens can create reports
// Optional image field name: image
router.post(
    "/",
    authenticateToken,
    citizenOnly,
    upload.single("image"),
    async (req, res) => {
        let uploadedImageKey = null;

        try {
            const { title, description, location, severity } = req.body;

            if (
                !title ||
                !description ||
                location === undefined ||
                !severity
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Title, description, location and severity are required."
                });
            }

            if (
                typeof title !== "string" ||
                typeof description !== "string" ||
                !title.trim() ||
                !description.trim()
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Title and description must be valid text."
                });
            }

            if (
                !["Low", "Medium", "High", "Critical"].includes(severity)
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Severity must be Low, Medium, High or Critical."
                });
            }

            // Convert location JSON string into a proper object
            let normalizedLocation;

            try {
                normalizedLocation = normalizeLocation(location);
            } catch (locationError) {
                return res.status(400).json({
                    success: false,
                    message: locationError.message
                });
            }

            // Upload the optional image to private AWS S3
            if (req.file) {
                uploadedImageKey = await uploadImage(req.file);
            }

            // Generate a temporary viewing URL
            const imageUrl = uploadedImageKey
                ? await getImageUrl(uploadedImageKey)
                : null;

            const report = {
                title: title.trim(),
                description: description.trim(),
                location: normalizedLocation,
                severity,
                status: "Pending",
                imageKey: uploadedImageKey,
                imageUrl,
                createdBy: req.user.userId,
                createdByEmail: req.user.email,
                createdAt: new Date()
            };

            const db = getDB();

            const result = await db
                .collection("reports")
                .insertOne(report);

            res.status(201).json({
                success: true,
                message: "Pothole report created successfully.",
                reportId: result.insertedId,
                report
            });
        } catch (error) {
            console.error("Create report error:", error.message);

            // Best-effort cleanup if S3 upload succeeded
            // but report creation failed
            if (uploadedImageKey) {
                try {
                    const {
                        DeleteObjectCommand
                    } = require("@aws-sdk/client-s3");

                    const s3 = require("../config/s3");

                    await s3.send(
                        new DeleteObjectCommand({
                            Bucket: process.env.AWS_S3_BUCKET,
                            Key: uploadedImageKey
                        })
                    );
                } catch (cleanupError) {
                    console.error(
                        "S3 cleanup error:",
                        cleanupError.message
                    );
                }
            }

            res.status(500).json({
                success: false,
                message: "Failed to create pothole report."
            });
        }
    }
);

// GET: Everyone can view all pothole reports
router.get("/", async (req, res) => {
    try {
        const db = getDB();

        const reports = await db
            .collection("reports")
            .find({})
            .sort({ createdAt: -1 })
            .toArray();

        // Generate fresh temporary URLs for private S3 images
        const reportsWithImages = await Promise.all(
            reports.map(async (report) => {
                let imageUrl = null;
                let repairedImageUrl = null;

                // Original pothole image
                if (report.imageKey) {
                    imageUrl = await getImageUrl(report.imageKey);
                } else if (report.imageUrl) {
                    // Support older records
                    imageUrl = report.imageUrl;
                }

                // Repaired-road image
                if (report.repairedImageKey) {
                    repairedImageUrl = await getImageUrl(
                        report.repairedImageKey
                    );
                } else if (report.repairedImageUrl) {
                    // Support older records that stored a URL
                    repairedImageUrl = report.repairedImageUrl;
                }

                // Support older records whose location is a JSON string
                let normalizedReportLocation = report.location;

                if (typeof report.location === "string") {
                    try {
                        normalizedReportLocation = JSON.parse(
                            report.location
                        );
                    } catch {
                        normalizedReportLocation = {
                            address: report.location
                        };
                    }
                }

                return {
                    ...report,
                    location: normalizedReportLocation,
                    imageUrl,
                    repairedImageUrl
                };
            })
        );

        res.json({
            success: true,
            count: reportsWithImages.length,
            reports: reportsWithImages
        });
    } catch (error) {
        console.error("Get reports error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve pothole reports."
        });
    }
});

// PATCH: Only officers can mark reports as repaired
// Required multipart file field: repairedImage
router.patch(
    "/:id/repair",
    authenticateToken,
    officerOnly,
    upload.single("repairedImage"),
    async (req, res) => {
        let uploadedImageKey = null;

        try {
            const { repairDescription } = req.body;
            const { id } = req.params;

            if (!ObjectId.isValid(id)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid report ID."
                });
            }

            if (
                typeof repairDescription !== "string" ||
                !repairDescription.trim()
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Repair description is required."
                });
            }

            // A repaired-road image is mandatory
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: "Please select a repaired-road image."
                });
            }

            // Upload the selected image to private AWS S3
            uploadedImageKey = await uploadImage(req.file);

            const db = getDB();

            const result = await db.collection("reports").updateOne(
                {
                    _id: new ObjectId(id),
                    status: { $nin: ["Repaired", "Resolved"] }
                },
                {
                    $set: {
                        status: "Repaired",
                        repairDescription: repairDescription.trim(),
                        repairedImageKey: uploadedImageKey,
                        repairedAt: new Date(),
                        repairedBy: req.user.email
                    },
                    $unset: {
                        repairedImageUrl: ""
                    }
                }
            );

            if (result.matchedCount === 0) {
                // The report is missing or already repaired.
                // Clean up the image uploaded for this attempt.
                try {
                    const {
                        DeleteObjectCommand
                    } = require("@aws-sdk/client-s3");

                    const s3 = require("../config/s3");

                    await s3.send(
                        new DeleteObjectCommand({
                            Bucket: process.env.AWS_S3_BUCKET,
                            Key: uploadedImageKey
                        })
                    );

                    uploadedImageKey = null;
                } catch (cleanupError) {
                    console.error(
                        "S3 cleanup error:",
                        cleanupError.message
                    );
                }

                return res.status(404).json({
                    success: false,
                    message: "Report not found or already repaired."
                });
            }

            res.json({
                success: true,
                message: "Pothole marked as repaired successfully."
            });
        } catch (error) {
            console.error("Repair update error:", error.message);

            // Best-effort cleanup if the upload succeeded
            // but the database update failed
            if (uploadedImageKey) {
                try {
                    const {
                        DeleteObjectCommand
                    } = require("@aws-sdk/client-s3");

                    const s3 = require("../config/s3");

                    await s3.send(
                        new DeleteObjectCommand({
                            Bucket: process.env.AWS_S3_BUCKET,
                            Key: uploadedImageKey
                        })
                    );
                } catch (cleanupError) {
                    console.error(
                        "S3 cleanup error:",
                        cleanupError.message
                    );
                }
            }

            res.status(500).json({
                success: false,
                message: "Failed to update repair details."
            });
        }
    }
);

module.exports = router;
