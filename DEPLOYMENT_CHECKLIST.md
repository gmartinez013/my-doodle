# ColorBot Deployment Checklist ✅

## 🔧 Pre-Deployment Requirements

### 1. AWS CLI Setup
Check if AWS CLI is configured:
```bash
aws sts get-caller-identity
```
If not configured, run:
```bash
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Enter region: us-east-1
# Enter output format: json
```

### 2. Get Your AWS Account ID
```bash
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "Your AWS Account ID: $AWS_ACCOUNT_ID"
```

### 3. Set Required Environment Variables
```bash
# Replace with your actual values
export OPENAI_API_KEY="sk-your-openai-api-key-here"
export SMS_PHONE_NUMBER="+1234567890"  # Your phone number with country code
export S3_BUCKET_NAME="colorbot-$(date +%s)"  # Unique bucket name
export AWS_ACCOUNT_ID="your-account-id-from-step-2"
```

### 4. Verify Environment Variables
```bash
echo "OpenAI Key: ${OPENAI_API_KEY:0:10}..."
echo "Phone: $SMS_PHONE_NUMBER"
echo "Bucket: $S3_BUCKET_NAME"
echo "Account: $AWS_ACCOUNT_ID"
```

## 🚀 Deployment Commands

### 1. Navigate to Deployment Directory
```bash
cd deployment
```

### 2. Make Script Executable (if needed)
```bash
chmod +x deploy.sh
chmod +x setup-parameters.sh
```

### 3. Run Deployment
```bash
./deploy.sh
```

## 📋 What the Script Will Create

- ✅ Secure Parameter Store entries (encrypted)
- ✅ S3 bucket with public read policy
- ✅ IAM role with minimal required permissions
- ✅ Lambda function with your code
- ✅ Alexa skill trigger permissions

## 🔍 Verify Deployment Success

### Check Lambda Function
```bash
aws lambda get-function --function-name colorbot-alexa-skill
```

### Check Parameter Store
```bash
aws ssm get-parameters --names '/colorbot/openai-api-key' '/colorbot/sms-phone-number' '/colorbot/s3-bucket-name' --with-decryption
```

### Check S3 Bucket
```bash
aws s3 ls s3://$S3_BUCKET_NAME
```

## 🎯 Next Steps After Deployment

1. **Copy your Lambda ARN** from the deployment output
2. **Go to Amazon Developer Console**: https://developer.amazon.com/alexa/console/ask
3. **Create new Alexa skill** named "ColorBot"
4. **Set endpoint** to your Lambda ARN
5. **Upload interaction models** from `alexa-skill/interactionModels/`
6. **Test in Alexa Simulator**

## 🚨 Common Issues & Solutions

### "Bucket already exists"
```bash
export S3_BUCKET_NAME="colorbot-$(whoami)-$(date +%s)"
```

### "Access Denied"
- Check AWS credentials: `aws configure list`
- Verify IAM permissions for Lambda, S3, SNS, Parameter Store

### "OpenAI API Error"
- Verify API key is valid
- Check OpenAI account has credits
- Test: `curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models`

### "SMS Failed"
- Phone number must include country code (+1...)
- Verify SNS permissions in your AWS account

## 💰 Cost Estimate

- **Lambda**: ~$0.20 per 1M requests
- **S3**: ~$0.023 per GB stored
- **SNS SMS**: ~$0.0075 per message
- **Parameter Store**: Free for standard parameters

**Estimated monthly cost for moderate use: $1-5**