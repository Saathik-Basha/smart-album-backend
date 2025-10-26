const AWS = require("aws-sdk");
const formatPhotoResponse = require("../utils/formatPhotoResponse");
const sendResponse = require("../utils/sendResponse");
const { PHOTOS_TABLE } = require("../const/paths");
const { dynamoDb } = require("../const/providers");
const fetchWithFilter = require("./utils/fetchWithFilter");

exports.getPhotos = async (event) => {
  
  const { limit, startKey, label } = event.queryStringParameters || {};

    const ExclusiveStartKey = {
        primary_key: startKey,
    };
  const filter = label
        ? {
              ExpressionAttributeValues: {
                  ":label": label,
              },
              FilterExpression: "contains (labels, :label)",
          }
        : {};
    const results = await fetchWithFilter({
        TableName: PHOTOS_TABLE,
        Limit: limit || 10,
        ...(startKey ? { ExclusiveStartKey } : {}),
        ...filter,
    })
    console.log(results);
  return sendResponse(200, {
         items: formatPhotoResponse(results.items),
        lastKey: results.lastKey,
    });
};
