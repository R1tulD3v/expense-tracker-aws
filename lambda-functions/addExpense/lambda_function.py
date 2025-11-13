import json
import boto3
import uuid
from datetime import datetime
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('ExpenseTracker')

def lambda_handler(event, context):
    try:
        # Parse request body
        if 'body' in event:
            body = json.loads(event['body'])
        else:
            body = event
        
        # Get user ID (for now using a test user)
        user_id = body.get('userId', 'test-user')
        
        # Create expense item
        expense_item = {
            'userId': user_id,
            'expenseId': str(uuid.uuid4()),
            'amount': Decimal(str(body['amount'])),
            'category': body['category'],
            'description': body['description'],
            'date': body['date'],
            'timestamp': datetime.now().isoformat()
        }
        
        # Save to DynamoDB
        table.put_item(Item=expense_item)
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'message': 'Expense added successfully',
                'expenseId': expense_item['expenseId']
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'error': str(e)})
        }
