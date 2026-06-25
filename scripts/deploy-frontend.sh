#!/bin/bash
set -e

# Deploy frontend to S3 + CloudFront
# Usage: ./scripts/deploy-frontend.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

echo "=== Building frontend ==="
cd "$FRONTEND_DIR"
npm run build

echo ""
echo "=== Getting S3 bucket and CloudFront distribution ID ==="

# Get outputs from CloudFormation
BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name XptStore-Frontend \
  --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue" \
  --output text \
  --region us-east-1)

DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
  --stack-name XptStore-Frontend \
  --query "Stacks[0].Outputs[?OutputKey=='DistributionId'].OutputValue" \
  --output text \
  --region us-east-1)

FRONTEND_URL=$(aws cloudformation describe-stacks \
  --stack-name XptStore-Frontend \
  --query "Stacks[0].Outputs[?OutputKey=='FrontendUrl'].OutputValue" \
  --output text \
  --region us-east-1)

echo "Bucket: $BUCKET_NAME"
echo "Distribution: $DISTRIBUTION_ID"

echo ""
echo "=== Syncing files to S3 ==="
aws s3 sync "$FRONTEND_DIR/out" "s3://$BUCKET_NAME" \
  --delete \
  --region us-east-1

# Set cache headers for static assets (long cache)
aws s3 sync "$FRONTEND_DIR/out/_next" "s3://$BUCKET_NAME/_next" \
  --cache-control "public, max-age=31536000, immutable" \
  --region us-east-1

echo ""
echo "=== Invalidating CloudFront cache ==="
aws cloudfront create-invalidation \
  --distribution-id "$DISTRIBUTION_ID" \
  --paths "/*" \
  --region us-east-1

echo ""
echo "=== Done! ==="
echo "Frontend URL: $FRONTEND_URL"
