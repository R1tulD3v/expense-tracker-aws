
import json
import boto3
from boto3.dynamodb.conditions import Key
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')
table = dynamodb.Table('ExpenseTracker')

TOPIC_ARN = 'arn:aws:sns:eu-north-1:857156721720:ExpenseNotifications'  # Replace with your SNS ARN
MONTHLY_BUDGET = 10.0  # Set your budget limit

def lambda_handler(event, context):
    try:
        user_id = event.get('userId', 'test-user')
        
        # Get current month expenses
        response = table.query(
            KeyConditionExpression=Key('userId').eq(user_id)
        )
        
        expenses = response['Items']
        current_month = '2025-09'  # Current month
        
        # Calculate current month spending
        monthly_spending = 0
        for expense in expenses:
            if expense['date'].startswith(current_month):
                monthly_spending += float(expense['amount'])
        
        # Check budget status
        budget_percentage = (monthly_spending / MONTHLY_BUDGET) * 100
        
        if budget_percentage > 80:  # Alert if over 80% of budget
            message = f"""
🚨 BUDGET ALERT 🚨

User: {user_id}
Monthly Spending: ₹{monthly_spending:.2f}
Budget: ₹{MONTHLY_BUDGET:.2f}
Percentage Used: {budget_percentage:.1f}%

{"⚠️ WARNING: You've exceeded 80% of your monthly budget!" if budget_percentage > 80 else ""}
{"🚨 CRITICAL: You've exceeded your monthly budget!" if budget_percentage > 100 else ""}

Track your expenses: https://your-s3-website-url.com
            """
            
            # Send SNS notification
            sns.publish(
                TopicArn=TOPIC_ARN,
                Subject=f'Budget Alert: {budget_percentage:.1f}% of monthly budget used',
                Message=message
            )
            
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'Budget alert sent',
                    'monthlySpending': monthly_spending,
                    'budgetPercentage': budget_percentage
                })
            }
        else:
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'Budget is within limits',
                    'monthlySpending': monthly_spending,
                    'budgetPercentage': budget_percentage
                })
            }
            
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
