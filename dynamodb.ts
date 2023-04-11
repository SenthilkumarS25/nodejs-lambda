import { DynamoDBClient, DocumentClient } from "@aws-sdk/client-dynamodb";

const tableName = "my-priority-queue";

const dynamoDBClient = new DynamoDBClient({ region: "us-east-1" });
const documentClient = new DocumentClient({ service: dynamoDBClient });

async function enqueueItem(item: any, priority: number) {
  const params = {
    TableName: tableName,
    Item: { item, priority },
  };

  await documentClient.put(params).promise();
}

async function dequeueItem() {
  const params = {
    TableName: tableName,
    KeyConditionExpression: "#pk = :pk",
    ExpressionAttributeNames: {
      "#pk": "priority",
    },
    ExpressionAttributeValues: {
      ":pk": { N: "1" },
    },
    Limit: 1,
    ScanIndexForward: false,
  };

  const result = await documentClient.query(params).promise();

  if (result.Items && result.Items.length > 0) {
    const item = result.Items[0].item;
    const deleteParams = {
      TableName: tableName,
      Key: {
        item,
        priority: result.Items[0].priority,
      },
    };
    await documentClient.delete(deleteParams).promise();
    return item;
  }

  return null;
}

async function peekTopItem() {
  const params = {
    TableName: tableName,
    KeyConditionExpression: "#pk = :pk",
    ExpressionAttributeNames: {
      "#pk": "priority",
    },
    ExpressionAttributeValues: {
      ":pk": { N: "1" },
    },
    Limit: 1,
    ScanIndexForward: false,
  };

  const result = await documentClient.query(params).promise();

  if (result.Items && result.Items.length > 0) {
    return result.Items[0].item;
  }

  return null;
}
