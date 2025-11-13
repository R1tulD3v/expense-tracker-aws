import json
import boto3
from boto3.dynamodb.conditions import Key
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('ExpenseTracker')

class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, Decimal):
            return float(o)
        return super(DecimalEncoder, self).default(o)

def lambda_handler(event, context):
    try:
        # Get user ID from query parameters or use test user
        user_id = 'test-user'
        if 'queryStringParameters' in event and event['queryStringParameters']:
            user_id = event['queryStringParameters'].get('userId', 'test-user')
        
        # Query expenses for user
        response = table.query(
            KeyConditionExpression=Key('userId').eq(user_id)
        )
        
        expenses = response['Items']
        
        # Calculate total spending
        total_spent = sum(float(expense['amount']) for expense in expenses)
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'expenses': expenses,
                'count': len(expenses),
                'totalSpent': total_spent
            }, cls=DecimalEncoder)
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
