#!/bin/bash

# ColorBot Parameter Store Setup Script
# This script securely stores sensitive configuration in AWS Parameter Store

echo "🔐 Setting up secure parameters for ColorBot..."

# Check if required values are provided
if [ -z "$OPENAI_API_KEY" ] || [ -z "$SMS_PHONE_NUMBER" ] || [ -z "$S3_BUCKET_NAME" ]; then
    echo "❌ Error: Required environment variables are missing."
    echo "Please set: OPENAI_API_KEY, SMS_PHONE_NUMBER, S3_BUCKET_NAME"
    echo ""
    echo "Example:"
    echo "export OPENAI_API_KEY='sk-your-key-here'"
    echo "export SMS_PHONE_NUMBER='+1234567890'"
    echo "export S3_BUCKET_NAME='my-coloring-bucket'"
    echo "Then run this script again."
    exit 1
fi

# Store OpenAI API Key as SecureString (encrypted)
echo "📝 Storing OpenAI API Key (encrypted)..."
aws ssm put-parameter \
  --name "/colorbot/openai-api-key" \
  --value "$OPENAI_API_KEY" \
  --type "SecureString" \
  --description "OpenAI API key for ColorBot image generation" \
  --overwrite

# Store SMS Phone Number as SecureString (encrypted)
echo "📱 Storing SMS Phone Number (encrypted)..."
aws ssm put-parameter \
  --name "/colorbot/sms-phone-number" \
  --value "$SMS_PHONE_NUMBER" \
  --type "SecureString" \
  --description "Phone number for ColorBot SMS notifications" \
  --overwrite

# Store S3 Bucket Name as String (not sensitive)
echo "🪣 Storing S3 Bucket Name..."
aws ssm put-parameter \
  --name "/colorbot/s3-bucket-name" \
  --value "$S3_BUCKET_NAME" \
  --type "String" \
  --description "S3 bucket name for ColorBot image storage" \
  --overwrite

echo "✅ All parameters stored securely!"
echo ""
echo "📋 Parameters created:"
echo "  • /colorbot/openai-api-key (SecureString - encrypted)"
echo "  • /colorbot/sms-phone-number (SecureString - encrypted)"
echo "  • /colorbot/s3-bucket-name (String)"
echo ""
echo "🔍 To verify parameters were created:"
echo "aws ssm get-parameters --names '/colorbot/openai-api-key' '/colorbot/sms-phone-number' '/colorbot/s3-bucket-name' --with-decryption"