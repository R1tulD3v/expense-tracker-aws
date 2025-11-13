
import json
import boto3
from boto3.dynamodb.conditions import Key
from datetime import datetime, timedelta
from collections import defaultdict
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
        # Get user ID
        user_id = 'test-user'
        if 'queryStringParameters' in event and event['queryStringParameters']:
            user_id = event['queryStringParameters'].get('userId', 'test-user')
        
        # Get all expenses for the user
        response = table.query(
            KeyConditionExpression=Key('userId').eq(user_id)
        )
        
        expenses = response['Items']
        
        if not expenses:
            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({
                    'message': 'No expenses found',
                    'totalSpent': 0,
                    'categoryBreakdown': {},
                    'totalTransactions': 0
                })
            }
        
        # Calculate insights
        total_spent = sum(float(expense['amount']) for expense in expenses)
        
        # Category breakdown
        category_totals = defaultdict(float)
        for expense in expenses:
            category_totals[expense['category']] += float(expense['amount'])
        
        # Monthly spending trend
        monthly_spending = defaultdict(float)
        for expense in expenses:
            month_key = expense['date'][:7]  # YYYY-MM format
            monthly_spending[month_key] += float(expense['amount'])
        
        # Top spending categories
        top_categories = sorted(category_totals.items(), key=lambda x: x, reverse=True)[:5]
        
        # Average daily spending
        dates = [expense['date'] for expense in expenses]
        date_range = (datetime.fromisoformat(max(dates)) - datetime.fromisoformat(min(dates))).days + 1
        avg_daily_spending = total_spent / date_range if date_range > 0 else total_spent
        
        insights = {
            'totalSpent': total_spent,
            'averageDailySpending': round(avg_daily_spending, 2),
            'categoryBreakdown': dict(category_totals),
            'topCategories': top_categories,
            'monthlyTrend': dict(monthly_spending),
            'totalTransactions': len(expenses)
        }
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps(insights, cls=DecimalEncoder)
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
