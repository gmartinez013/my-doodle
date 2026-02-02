#!/bin/bash

# ColorBot DynamoDB Table Setup Script
# Creates the query logging table

echo "Creating ColorBot query logs table..."

# Create the DynamoDB table
aws dynamodb create-table \
  --table-name colorbot-query-logs \
  --attribute-definitions \
    AttributeName=requestId,AttributeType=S \
  --key-schema \
    AttributeName=requestId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --tags Key=Project,Value=ColorBot Key=Purpose,Value=QueryLogging

if [ $? -eq 0 ]; then
  echo "Table created successfully!"
  echo ""
  echo "Waiting for table to become active..."
  aws dynamodb wait table-exists --table-name colorbot-query-logs
  echo "Table is now active and ready to use."
else
  # Check if table already exists
  aws dynamodb describe-table --table-name colorbot-query-logs > /dev/null 2>&1
  if [ $? -eq 0 ]; then
    echo "Table already exists. Skipping creation."
  else
    echo "Failed to create table. Check your AWS credentials and permissions."
    exit 1
  fi
fi

echo ""
echo "Table details:"
aws dynamodb describe-table --table-name colorbot-query-logs --query 'Table.{Name:TableName,Status:TableStatus,ItemCount:ItemCount}' --output table
