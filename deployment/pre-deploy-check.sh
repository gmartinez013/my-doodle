#!/bin/bash

# ColorBot Pre-Deployment Verification Script
echo "🎨 ColorBot Pre-Deployment Check"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check functions
check_aws_cli() {
    echo -n "Checking AWS CLI... "
    if command -v aws &> /dev/null; then
        echo -e "${GREEN}✓ Installed${NC}"
        return 0
    else
        echo -e "${RED}✗ Not found${NC}"
        echo "Install AWS CLI: https://aws.amazon.com/cli/"
        return 1
    fi
}

check_aws_credentials() {
    echo -n "Checking AWS credentials... "
    if aws sts get-caller-identity &> /dev/null; then
        echo -e "${GREEN}✓ Configured${NC}"
        AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
        echo "  Account ID: $AWS_ACCOUNT_ID"
        return 0
    else
        echo -e "${RED}✗ Not configured${NC}"
        echo "Run: aws configure"
        return 1
    fi
}

check_environment_vars() {
    echo "Checking environment variables..."
    local all_set=true
    
    if [ -z "$OPENAI_API_KEY" ]; then
        echo -e "  ${RED}✗ OPENAI_API_KEY not set${NC}"
        all_set=false
    else
        echo -e "  ${GREEN}✓ OPENAI_API_KEY set${NC} (${OPENAI_API_KEY:0:10}...)"
    fi
    
    if [ -z "$SMS_PHONE_NUMBER" ]; then
        echo -e "  ${RED}✗ SMS_PHONE_NUMBER not set${NC}"
        all_set=false
    else
        echo -e "  ${GREEN}✓ SMS_PHONE_NUMBER set${NC} ($SMS_PHONE_NUMBER)"
    fi
    
    if [ -z "$S3_BUCKET_NAME" ]; then
        echo -e "  ${RED}✗ S3_BUCKET_NAME not set${NC}"
        all_set=false
    else
        echo -e "  ${GREEN}✓ S3_BUCKET_NAME set${NC} ($S3_BUCKET_NAME)"
    fi
    
    if [ -z "$AWS_ACCOUNT_ID" ]; then
        echo -e "  ${YELLOW}⚠ AWS_ACCOUNT_ID not set, will auto-detect${NC}"
        export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null)
        if [ -n "$AWS_ACCOUNT_ID" ]; then
            echo -e "  ${GREEN}✓ AWS_ACCOUNT_ID auto-detected${NC} ($AWS_ACCOUNT_ID)"
        fi
    else
        echo -e "  ${GREEN}✓ AWS_ACCOUNT_ID set${NC} ($AWS_ACCOUNT_ID)"
    fi
    
    return $all_set
}

check_openai_key() {
    echo -n "Validating OpenAI API key... "
    if [ -n "$OPENAI_API_KEY" ]; then
        if curl -s -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models | grep -q "gpt"; then
            echo -e "${GREEN}✓ Valid${NC}"
            return 0
        else
            echo -e "${RED}✗ Invalid or no credits${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}⚠ Skipped (not set)${NC}"
        return 1
    fi
}

check_s3_bucket_availability() {
    echo -n "Checking S3 bucket availability... "
    if [ -n "$S3_BUCKET_NAME" ]; then
        if aws s3 ls "s3://$S3_BUCKET_NAME" &> /dev/null; then
            echo -e "${RED}✗ Bucket already exists${NC}"
            echo "  Try: export S3_BUCKET_NAME=\"colorbot-\$(whoami)-\$(date +%s)\""
            return 1
        else
            echo -e "${GREEN}✓ Available${NC}"
            return 0
        fi
    else
        echo -e "${YELLOW}⚠ Skipped (not set)${NC}"
        return 1
    fi
}

# Run all checks
echo ""
all_good=true

check_aws_cli || all_good=false
check_aws_credentials || all_good=false
check_environment_vars || all_good=false
check_openai_key || all_good=false
check_s3_bucket_availability || all_good=false

echo ""
echo "================================"

if [ "$all_good" = true ]; then
    echo -e "${GREEN}🎉 All checks passed! Ready to deploy.${NC}"
    echo ""
    echo "Run deployment:"
    echo "  ./deploy.sh"
    exit 0
else
    echo -e "${RED}❌ Some checks failed. Please fix the issues above.${NC}"
    echo ""
    echo "Quick setup commands:"
    echo "  export OPENAI_API_KEY=\"sk-your-key-here\""
    echo "  export SMS_PHONE_NUMBER=\"+1234567890\""
    echo "  export S3_BUCKET_NAME=\"colorbot-\$(whoami)-\$(date +%s)\""
    echo "  export AWS_ACCOUNT_ID=\"\$(aws sts get-caller-identity --query Account --output text)\""
    exit 1
fi