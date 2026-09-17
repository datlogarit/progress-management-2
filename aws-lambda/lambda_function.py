import json
import os
import boto3

# Khởi tạo S3 client
s3 = boto3.client('s3')

# Lấy tên Bucket từ biến môi trường của Lambda (hoặc điền trực tiếp tên bucket)
BUCKET_NAME = os.environ.get('BUCKET_NAME', 'your-s3-bucket-name')
FILE_NAME = 'message.txt'

def lambda_handler(event, context):
    print("Received event:", json.dumps(event))
    
    # Xử lý CORS preflight request (OPTIONS)
    http_method = event.get('requestContext', {}).get('http', {}).get('method') or event.get('httpMethod')
    if http_method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'OPTIONS,POST'
            },
            'body': ''
        }

    try:
        # Lấy body từ request
        body_raw = event.get('body', '{}')
        if isinstance(body_raw, str):
            body = json.loads(body_raw) if body_raw else {}
        else:
            body = body_raw or {}

        message = body.get('message', '')

        # Ghi đè vào file message.txt trên S3
        s3.put_object(
            Bucket=BUCKET_NAME,
            Key=FILE_NAME,
            Body=message.encode('utf-8'),
            ContentType='text/plain; charset=utf-8'
        )

        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'OPTIONS,POST'
            },
            'body': json.dumps({
                'success': True,
                'message': f'Ghi đè file {FILE_NAME} trên S3 ({BUCKET_NAME}) thành công!',
                'content': message
            })
        }

    except Exception as e:
        print("Error saving to S3:", str(e))
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'OPTIONS,POST'
            },
            'body': json.dumps({
                'success': False,
                'error': str(e)
            })
        }
