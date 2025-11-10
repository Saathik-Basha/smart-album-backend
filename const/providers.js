const AWS = require("aws-sdk");

const s3 = new AWS.S3();
const rekognition = new AWS.Rekognition({
  region: process.env.AWS_REGION || "us-east-1",
});
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const cognito = new AWS.CognitoIdentityServiceProvider();

module.exports = {
    s3,
    rekognition,
    dynamoDb,
    cognito,
};