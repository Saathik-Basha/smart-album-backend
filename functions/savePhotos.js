const AWS = require("aws-sdk");
const parser = require("lambda-multipart-parser");
// Remove the old line:
// const { v4: uuidv4 } = require("uuid");
const sendResponse = require("../utils/sendResponse");
const {
    PHOTOS_TABLE,
    ORIGINAL_BUCKET_NAME,
    THUMBNAIL_BUCKET_NAME,
} = require("../const/paths");
const { s3, rekognition, dynamoDb } = require("../const/providers");
let uuidv4;
(async () => {
  uuidv4 = (await import("uuid")).v4;
})();

const sharp= require('sharp')

const width = 600;
async function saveFile(file) {
  console.log({ file });

  const thumbnail = await sharp(file.content)
        .resize(width)
        .withMetadata()
        .toBuffer();
  const savedFile = await s3
    .putObject({
      Bucket: ORIGINAL_BUCKET_NAME,
      Key: file.filename,
      Body: file.content,
    })
    .promise();
  await s3
        .putObject({
            Bucket: THUMBNAIL_BUCKET_NAME,
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
            TableName: PHOTOS_TABLE,
            Item: {
                primary_key,
                name: file.filename,
                labels,
            },
        })
        .promise();

  return {
    primary_key,
    savedFile: `https://${ORIGINAL_BUCKET_NAME}.s3.amazonaws.com/${file.filename}`,
    thumbnail: `https://${THUMBNAIL_BUCKET_NAME}.s3.amazonaws.com/${file.filename}`,
    labels,
  };
}

exports.savePhoto = async (event) => {
  try {
    const { files } = await parser.parse(event);
    const filesData = files.map(saveFile);

    const results = await Promise.all(filesData);

    return sendResponse(200,results)
  } catch (error) {
    console.error("Error saving photo:", error);
    return sendResponse(500,error)
  }
};

