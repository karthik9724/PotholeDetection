const path = require("node:path");
require(path.join(__dirname, "..", "server", "node_modules", "dotenv")).config({ path: path.join(__dirname, "..", "server", ".env") });

const { MongoClient } = require(path.join(__dirname, "..", "server", "node_modules", "mongodb"));
const fs = require("node:fs");

const OUTPUT_FILE = path.join(
    __dirname,
    "..",
    "hadoop/input",
    "pothole_reports.csv"
);

function escapeCSV(value) {
    if (value === undefined || value === null) {
        return "";
    }

    const text = String(value);
    return `"${text.replace(/"/g, '""')}"`;
}

async function exportReports() {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
        throw new Error("MONGODB_URI is missing from server/.env");
    }

    const client = new MongoClient(uri);

    try {
        await client.connect();

        const db = client.db("pothole_detection");

        const reports = await db
            .collection("reports")
            .find({})
            .sort({ createdAt: -1 })
            .toArray();

        const header = [
            "id",
            "title",
            "severity",
            "status",
            "address",
            "latitude",
            "longitude"
        ];

        const rows = reports.map((report) => {
            let location = report.location || {};

            if (typeof location === "string") {
                try {
                    location = JSON.parse(location);
                } catch {
                    location = { address: location };
                }
            }

            return [
                report._id,
                report.title,
                report.severity,
                report.status,
                location.address,
                location.latitude,
                location.longitude
            ].map(escapeCSV).join(",");
        });

        fs.writeFileSync(
            OUTPUT_FILE,
            [header.join(","), ...rows].join("\n") + "\n",
            "utf8"
        );

        console.log("Export completed successfully.");
        console.log("Reports exported:", reports.length);
        console.log("CSV saved to:", OUTPUT_FILE);
    } finally {
        await client.close();
    }
}

exportReports().catch((error) => {
    console.error("Export failed:", error.message);
    process.exitCode = 1;
});
