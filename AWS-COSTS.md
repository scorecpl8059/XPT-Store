# AWS Services & Costs

## Free Tier (12 months from account creation)

| Service | Free Allowance | After Free Tier |
|---------|---------------|-----------------|
| **Amplify Hosting** | 1,000 build min, 15 GB served, 500K SSR requests, 100 GB-hr compute, 5 GB storage | $0.01/build min, $0.15/GB, $0.30/M requests, $0.20/GB-hr |
| **DynamoDB** | 25 GB storage, 25 RCU, 25 WCU | $1.25/M write, $0.25/M read, $0.25/GB |
| **Lambda** | 1M requests, 400K GB-sec/month | $0.20/M requests, $0.0000166667/GB-sec |
| **API Gateway** | 1M REST API calls/month | $3.50/M calls |
| **S3** | 5 GB storage, 20K GET, 2K PUT | $0.023/GB, $0.0004/1K GET, $0.005/1K PUT |
| **CloudFront** | 1 TB transfer, 10M requests | $0.085/GB, $0.0075/10K requests |

## Always Free

| Service | Free Allowance |
|---------|---------------|
| **DynamoDB** | 25 GB + 25 RCU/WCU (always free, not just 12 months) |
| **Lambda** | 1M requests + 400K GB-sec (always free) |
| **CloudFront** | 1 TB/month (always free) |

## Not Free / Pay-per-use (no free tier)

| Service | Cost | Notes |
|---------|------|-------|
| **SES (Email)** | $0.10/1K emails | First 62K/month free if sent from EC2 |
| **OpenSearch** | ~$25/month minimum | Smallest instance (t3.small.search). Not deployed yet — using DynamoDB scan for search initially |
| **Route 53** | $0.50/hosted zone/month + $0.40/M queries | Only if using custom domain |
| **WAF** | $5/month + $1/rule + $0.60/M requests | Deployed in Security stack |

## Current Monthly Estimate (low traffic, <1K orders/month)

- **Within free tier:** $0 - $5/month (mostly WAF)
- **After free tier expires:** ~$10 - $25/month

## How to Monitor Costs

1. AWS Console > **Billing & Cost Management** > **Cost Explorer**
2. Set up a **Budget Alert**: Billing > Budgets > Create Budget > Set $10 threshold
