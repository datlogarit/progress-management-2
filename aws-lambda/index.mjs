import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({});
const BUCKET_NAME = process.env.BUCKET_NAME || 'your-s3-bucket-name';
const FILE_NAME = 'message.txt';

export const handler = async (event) => {
  console.log('Received event:', JSON.stringify(event));

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'OPTIONS,POST',
  };

  const httpMethod = event?.requestContext?.http?.method || event?.httpMethod;
  if (httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    let body = {};
    if (typeof event.body === 'string') {
      body = event.body ? JSON.parse(event.body) : {};
    } else if (event.body) {
      body = event.body;
    }

    const message = body.message || '';

    // Ghi đè vào message.txt trên S3
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: FILE_NAME,
        Body: message,
        ContentType: 'text/plain; charset=utf-8',
      })
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: `Ghi đè file ${FILE_NAME} trên S3 (${BUCKET_NAME}) thành công!`,
        content: message,
      }),
    };
  } catch (error) {
    console.error('Error writing to S3:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
      }),
    };
  }
};
