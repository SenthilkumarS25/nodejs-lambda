const AWS = require('aws-sdk');
const s3 = new AWS.S3({apiVersion: '2006-03-01'});
const ses = new AWS.SES({apiVersion: '2010-12-01'});

exports.handler = async (event, context) => {
    let response;
    try {
        const s3Params = {
            Bucket: 'YOUR_BUCKET_NAME',
            Key: 'email_data.json', // Name of the file with email data
        };
        response = await s3.getObject(s3Params).promise();
    } catch (error) {
        return {
            statusCode: 500,
            body: error
        };
    }

    if (!response.Body) {
        return {
            statusCode: 200,
            body: "No data in the bucket"
        };
    }
    const emailData = JSON.parse(response.Body.toString());
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
    return {
        statusCode: 200,
        body: "Email sent"
    };
};
