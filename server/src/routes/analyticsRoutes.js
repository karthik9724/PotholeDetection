
const express = require("express");
const fs = require("node:fs/promises");
const path = require("node:path");
const { getDB } = require("../config/db");

const router = express.Router();

const HADOOP_OUTPUT = path.resolve(
    __dirname,
    "../../../hadoop/output/live_location_counts/part-00000"
);

router.get("/", async (req, res) => {
    try {
        const db = getDB();

        // Read report information from MongoDB.
        const reports = await db.collection("reports")
            .find(
                {},
                {
                    projection: {
                        severity: 1,
                        status: 1
                    }
                }
            )
            .toArray();

        const severity = {
            Low: 0,
            Medium: 0,
            High: 0,
            Critical: 0
        };

        let pending = 0;
        let repaired = 0;

        for (const report of reports) {
            if (Object.hasOwn(severity, report.severity)) {
                severity[report.severity]++;
            }

            if (["Repaired", "Resolved"].includes(report.status)) {
                repaired++;
            } else {
                pending++;
            }
        }

        // Read the real Hadoop Streaming output.
        let locations = [];
        let hadoopAvailable = false;
        let hadoopMessage = "";

        try {
            const output = await fs.readFile(
                HADOOP_OUTPUT,
                "utf8"
            );

            locations = output
                .split(/\r?\n/)
                .map((line) => {
                    const match = line.match(
                        /^(.*?)[\t ]+(\d+)\s*$/
                    );

                    if (!match) return null;

                    return {
                        address: match[1].trim(),
                        count: Number(match[2])
                    };
                })
                .filter(
                    (item) => item && item.address && item.count > 0
                )
                .sort((a, b) => b.count - a.count);

            hadoopAvailable = true;
        } catch (error) {
            if (error.code === "ENOENT") {
                hadoopMessage =
                    "Hadoop output not found. Run the Hadoop job first.";
            } else {
                throw error;
            }
        }

        res.json({
            success: true,
            summary: {
                total: reports.length,
                pending,
                repaired
            },
            severity,
            locations,
            hadoopAvailable,
            hadoopMessage
        });
    } catch (error) {
        console.error("Analytics error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to load analytics."
        });
    }
});

module.exports = router;
