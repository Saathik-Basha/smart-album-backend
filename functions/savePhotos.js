const AWS = require("aws-sdk");
const parser = require("lambda-multipart-parser");
// Remove the old line:
// const { v4: uuidv4 } = require("uuid");

let uuidv4;
(async () => {
  uuidv4 = (await import("uuid")).v4;
})();

const sharp= require('sharp')

const width = 600;
const s3 = new AWS.S3();
const rekognition = new AWS.Rekognition({
  region: process.env.AWS_REGION || "us-east-1",
});
const dynamoDb=new AWS.DynamoDB.DocumentClient();

async function saveFile(file) {
  console.log({ file });
  const BucketName = process.env.ORIGINAL_BUCKET_NAME;
  const ThumbnailBucketName = process.env.THUMBNAIL_BUCKET_NAME;

  const thumbnail = await sharp(file.content)
        .resize(width)
        .withMetadata()
        .toBuffer();
  const savedFile = await s3
    .putObject({
      Bucket: BucketName,
      Key: file.filename,
      Body: file.content,
    })
    .promise();
  await s3
        .putObject({
            Bucket: ThumbnailBucketName,
            Key: file.filename,
            Body: thumbnail,
        })
        .promise();
  console.log("Calling Rekognition...");
  const { Labels } = await rekognition
    .detectLabels({
      Image: { Bytes: thumbnail },
    })
    .promise();
 
  const primary_key=uuidv4();
  const labels= Labels.map((label) => label.Name)
  await dynamoDb
        .put({
            TableName: process.env.PHOTOS_TABLE,
            Item: {
                primary_key,
                name: file.filename,
                labels,
            },
        })
        .promise();

  return {
    primary_key,
    savedFile: `https://${BucketName}.s3.amazonaws.com/${file.filename}`,
    labels,
  };
}

exports.savePhoto = async (event) => {
  const { files } = await parser.parse(event);
  const filesData = files.map(saveFile);

  const results = await Promise.all(filesData);
  return {
    statusCode: 200,
    body: JSON.stringify(results),
  };
};
