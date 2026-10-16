
const {
    PutObjectCommand,
    GetObjectCommand
} = require("@aws-sdk/client-s3");

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const s3 = require("./s3");
const crypto = require("node:crypto");

async function uploadImage(file) {
    const extensionMap = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp"
    };

    if (!file || !extensionMap[file.mimetype]) {
        throw new Error("A valid JPG, PNG or WEBP image is required.");
    }

    const imageKey = `pothole-reports/${crypto.randomUUID()}.${extensionMap[file.mimetype]}`;

    await s3.send(
        new PutObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: imageKey,
            Body: file.buffer,
            ContentType: file.mimetype
        })
    );

    return imageKey;
}

async function getImageUrl(imageKey) {
    if (!imageKey) {
        return null;
    }

    const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: imageKey
    });

    return getSignedUrl(s3, command, {
        expiresIn: 3600
    });
}

module.exports = {
    uploadImage,
    getImageUrl
};
