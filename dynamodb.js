const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB();

const TABLE_NAME = 'my-priority-queue';

async function addItemToQueue(queueId, item, priority) {
  await dynamodb.putItem({
    TableName: TABLE_NAME,
    Item: {
      queueId: { S: queueId },
      priority: { N: priority.toString() },
      item: { S: JSON.stringify(item) }
    }
  }).promise();
}

async function getNextItemFromQueue(queueId) {
  const result = await dynamodb.query({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'queueId = :queueId',
    ExpressionAttributeValues: {
      ':queueId': { S: queueId }
    },
    ScanIndexForward: true,
    Limit: 1
  }).promise();

  if (result.Items && result.Items.length > 0) {
    const item = JSON.parse(result.Items[0].item.S);
    const priority = parseInt(result.Items[0].priority.N);
    await removeItemFromQueue(queueId, item, priority);
    return item;
  } else {
    return null;
  }
}

async function removeItemFromQueue(queueId, item, priority) {
  await dynamodb.deleteItem({
    TableName: TABLE_NAME,
    Key: {
      queueId: { S: queueId },
      priority: { N: priority.toString() }
    }
  }).promise();
}

// Update item
const params = {
  TableName: 'my-table',
  Key: {
    'pk': { S: 'my-partition-key' },
    'sk': { S: 'my-sort-key' },
  },
  UpdateExpression: 'SET sk = :newSortKey',
  ExpressionAttributeValues: {
    ':newSortKey': { S: 'my-new-sort-key' },
  },
};

dynamodb.updateItem(params, (err, data) => {
  if (err) {
    console.error('Error updating item:', err);
  } else {
    console.log('Item updated successfully:', data);
  }
});

// Scan top item
const params = {
  TableName: 'myPriorityQueueTable',
  Limit: 1,
  ScanIndexForward: true,
  ProjectionExpression: 'priority, payload',
};

dynamodb.scan(params, (err, data) => {
  if (err) {
    console.log(err);
    return;
  }
  
  const topItem = data.Items[0];
  console.log(`Top item has priority ${topItem.priority.N} and payload ${topItem.payload.S}`);
});
