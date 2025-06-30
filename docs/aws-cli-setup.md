# AWS CLI Configuration Guide

## Method 1: Interactive Configuration (Recommended)

Run this command and follow the prompts:

```bash
aws configure
```

You'll be asked for:
- **AWS Access Key ID**: Your access key (starts with AKIA...)
- **AWS Secret Access Key**: Your secret key
- **Default region name**: `us-east-1` (recommended for Alexa skills)
- **Default output format**: `json` (recommended)

## Method 2: Set Environment Variables

```bash
export AWS_ACCESS_KEY_ID="AKIA..."
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_DEFAULT_REGION="us-east-1"
```

## Method 3: AWS Credentials File

Create/edit `~/.aws/credentials`:

```ini
[default]
aws_access_key_id = AKIA...
aws_secret_access_key = your-secret-key
```

And `~/.aws/config`:

```ini
[default]
region = us-east-1
output = json
```

## How to Get Your AWS Credentials

### Option A: Create IAM User (Recommended)

1. Go to [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. Click "Users" → "Add user"
3. Choose "Programmatic access"
4. Attach policies:
   - `AmazonS3FullAccess`
   - `AWSLambdaFullAccess`
   - `IAMFullAccess`
   - `AmazonSNSFullAccess`
   - `AmazonSSMFullAccess`
5. Download the CSV with your keys

### Option B: Use Root Account (Not Recommended)

1. Go to [AWS Security Credentials](https://console.aws.amazon.com/iam/home#/security_credentials)
2. Create access key under "Access keys"
3. Download and save securely

## Verify Configuration

Test your setup:

```bash
# Check if AWS CLI is configured
aws sts get-caller-identity

# Should return your account info
{
    "UserId": "AIDACKCEVSQ6C2EXAMPLE",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/your-username"
}
```

## Get Your AWS Account ID

```bash
aws sts get-caller-identity --query Account --output text
```

## Security Best Practices

- ✅ Use IAM users, not root account
- ✅ Enable MFA on your AWS account
- ✅ Use least privilege permissions
- ✅ Rotate access keys regularly
- ❌ Never commit credentials to code
- ❌ Don't share credentials

## Troubleshooting

### "Unable to locate credentials"
- Run `aws configure` to set up credentials
- Check `~/.aws/credentials` file exists

### "Access Denied" errors
- Verify your IAM user has required permissions
- Check the policies attached to your user

### "Invalid security token"
- Your credentials may be expired
- Regenerate access keys in IAM console

## Next Steps

Once configured, you can:

1. Set your environment variables:
```bash
export OPENAI_API_KEY="sk-your-key"
export SMS_PHONE_NUMBER="+1234567890"
export S3_BUCKET_NAME="my-colorbot-bucket"
export AWS_ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
```

2. Run the deployment:
```bash
cd deployment
./deploy.sh
```