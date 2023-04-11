import { DocumentClient } from "aws-sdk/clients/dynamodb";

interface QueueItem {
  id: string;
  priority: number;
  payload: string;
}

class PriorityQueue {
  private tableName: string;
  private dbClient: DocumentClient;

  constructor(tableName: string) {
    this.tableName = tableName;
    this.dbClient = new DocumentClient();
  }

  async enqueue(item: QueueItem) {
    await this.dbClient.put({
      TableName: this.tableName,
      Item: item,
    }).promise();
  }

  async dequeue(): Promise<QueueItem | undefined> {
    const result = await this.dbClient.query({
      TableName: this.tableName,
      KeyConditionExpression: "#pk = :pk",
      ExpressionAttributeNames: {
        "#pk": "priority",
      },
      ExpressionAttributeValues: {
        ":pk": 1,
      },
      Limit: 1,
      ScanIndexForward: false,
    }).promise();

    if (result.Items && result.Items.length > 0) {
      const item = result.Items[0] as QueueItem;
      await this.dbClient.delete({
        TableName: this.tableName,
        Key: {
          id: item.id,
        },
      }).promise();
      return item;
    }
    return undefined;
  }

  async peek(): Promise<QueueItem | undefined> {
    const result = await this.dbClient.query({
      TableName: this.tableName,
      KeyConditionExpression: "#pk = :pk",
      ExpressionAttributeNames: {
        "#pk": "priority",
      },
      ExpressionAttributeValues: {
        ":pk": 1,
      },
      Limit: 1,
      ScanIndexForward: false,
    }).promise();

    if (result.Items && result.Items.length > 0) {
      return result.Items[0] as QueueItem;
    }
    return undefined;
  }
}
