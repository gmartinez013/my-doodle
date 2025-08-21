#!/bin/bash

# ColorBot Alexa Skill - Deploy to AWS Cloud
# This script creates resources in YOUR AWS account, not locally

echo "🎨 Deploying ColorBot Alexa Skill to AWS Cloud..."
echo "📍 This creates resources in YOUR AWS account"
echo "🚀 The Lambda function will run in AWS, not on your machine"
echo ""

# Check if required environment variables are set
if [ -z "$AWS_ACCOUNT_ID" ] || [ -z "$OPENAI_API_KEY" ] || [ -z "$S3_BUCKET_NAME" ] || [ -z "$SMS_PHONE_NUMBER" ]; then
    echo "❌ Error: Required environment variables are missing."
    echo "Please set: AWS_ACCOUNT_ID, OPENAI_API_KEY, S3_BUCKET_NAME, SMS_PHONE_NUMBER"
    exit 1
fi

# Step 1: Setup secure parameters
echo "🔐 Setting up secure parameters..."
chmod +x setup-parameters.sh
./setup-parameters.sh

# Step 2: Create S3 bucket
echo "📦 Creating S3 bucket: $S3_BUCKET_NAME"
aws s3 mb s3://$S3_BUCKET_NAME --region us-east-1

# Step 2.1: Disable block public access to allow public read policy
echo "🔓 Configuring S3 bucket for public read access..."
aws s3api put-public-access-block --bucket $S3_BUCKET_NAME --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

# Step 3: Apply bucket policy
echo "🔐 Applying S3 bucket policy..."
sed "s/your-coloring-bucket/$S3_BUCKET_NAME/g" ../aws-setup/s3-bucket-policy.json > temp-bucket-policy.json
aws s3api put-bucket-policy --bucket $S3_BUCKET_NAME --policy file://temp-bucket-policy.json
rm temp-bucket-policy.json

# Step 4: Create IAM role
echo "👤 Creating IAM role..."
aws iam create-role --role-name ColorBotLambdaRole --assume-role-policy-document '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}'

# Step 5: Attach IAM policy
echo "🔒 Attaching IAM policy..."
sed "s/your-coloring-bucket/$S3_BUCKET_NAME/g" ../aws-setup/iam-policy.json > temp-iam-policy.json
aws iam put-role-policy --role-name ColorBotLambdaRole --policy-name ColorBotPolicy --policy-document file://temp-iam-policy.json
rm temp-iam-policy.json

# Step 6: Package Lambda function
echo "📦 Packaging Lambda function..."
cd ../lambda
zip -r ../deployment/colorbot-lambda.zip .
cd ../deployment

# Step 7: Create Lambda function (no environment variables needed - using Parameter Store)
echo "⚡ Creating Lambda function..."
aws lambda create-function \
  --function-name colorbot-alexa-skill \
  --runtime nodejs18.x \
  --role arn:aws:iam::$AWS_ACCOUNT_ID:role/ColorBotLambdaRole \
  --handler index.handler \
  --zip-file fileb://colorbot-lambda.zip \
  --timeout 30 \
  --memory-size 256 \

# Step 8: Add Alexa trigger
echo "🗣️ Adding Alexa trigger to Lambda..."
aws lambda add-permission \
  --function-name colorbot-alexa-skill \
  --statement-id alexa-skill-trigger \
  --action lambda:InvokeFunction \
  --principal alexa-appkit.amazon.com

echo "✅ Deployment complete!"
echo "📋 Next steps:"
echo "1. Create Alexa skill in Amazon Developer Console"
echo "2. Set endpoint to: arn:aws:lambda:us-east-1:$AWS_ACCOUNT_ID:function:colorbot-alexa-skill"
echo "3. Upload interaction models from alexa-skill/interactionModels/"
echo "4. Test the skill!"
echo ""
echo "🔐 Security: All sensitive data is stored in AWS Parameter Store with encryption"

# Clean up
rm colorbot-lambda.zip