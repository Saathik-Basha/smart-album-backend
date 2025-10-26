const AWS = require("aws-sdk");

const s3 = new AWS.S3();
const rekognition = new AWS.Rekognition({
  region: process.env.AWS_REGION || "us-east-1",
});
const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports = {
    s3,
    rekognition,
    dynamoDb,
};