const AWS = require('aws-sdk');
const sqs = new AWS.SQS({ apiVersion: '2012-11-05' });
const ses = new AWS.SES({ apiVersion: '2010-12-01' });

exports.handler = async (event, context) => {
  let response;
  try {
    const sqsParams = {
      QueueUrl: 'YOUR_SQS_QUEUE_URL',
      MaxNumberOfMessages: 10, // Number of messages to receive in one call
      VisibilityTimeout: 0,
      WaitTimeSeconds: 0
    };
    response = await sqs.receiveMessage(sqsParams).promise();
  } catch (error) {
    return {
      statusCode: 500,
      body: error
    };
  }

  if (!response.Messages) {
    return {
      statusCode: 200,
      body: "No messages in queue"
    };
  }
  for (const message of response.Messages) {
    const emailData = JSON.parse(message.Body);
    try {
      const sesParams = {
        Destination: {
          ToAddresses: [emailData.to]
        },
        Message: {
          Body: {
            Text: {
              Charset: 'UTF-8',
              Data: emailData.body
            }
          },
          Subject: {
            Charset: 'UTF-8',
            Data: emailData.subject
          }
        },
        Source: emailData.from
      };
      await ses.sendEmail(sesParams).promise();
    } catch (error) {
      return {
        statusCode: 500,
        body: error
      };
    }
    try {
      const deleteParams = {
        QueueUrl: 'YOUR_SQS_QUEUE_URL',
        ReceiptHandle: message.ReceiptHandle
      };
      await sqs.deleteMessage(deleteParams).promise();
    } catch (error) {
      return {
        statusCode: 500,
        body: error
      };
    }
  }
  return {
    statusCode: 200,
    body: "All messages processed"
  };
};
