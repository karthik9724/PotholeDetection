
const { S3Client } = require("@aws-sdk/client-s3");

const requiredVariables = [
    "AWS_REGION",
    "AWS_S3_BUCKET",
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY"
];

for (const variable of requiredVariables) {
    if (!process.env[variable]) {
        throw new Error(`Missing environment variable: ${variable}`);
    }
}

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

module.exports = s3;
