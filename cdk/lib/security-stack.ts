import * as cdk from "aws-cdk-lib";
import * as wafv2 from "aws-cdk-lib/aws-wafv2";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";

export class SecurityStack extends cdk.Stack {
  public readonly webAcl: wafv2.CfnWebACL;
  public readonly appSecrets: secretsmanager.Secret;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ── AWS WAF ──
    // Protects API Gateway from common attacks
    this.webAcl = new wafv2.CfnWebACL(this, "StoreWebAcl", {
      name: "xpt-store-waf",
      scope: "REGIONAL", // REGIONAL for API Gateway, CLOUDFRONT for CloudFront
      defaultAction: { allow: {} },
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: "xptStoreWaf",
      },
      rules: [
        // Rule 1: AWS Managed — Common Rule Set (XSS, SQLi, bad inputs)
        {
          name: "AWSManagedRulesCommonRuleSet",
          priority: 1,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: "AWS",
              name: "AWSManagedRulesCommonRuleSet",
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: "commonRuleSet",
          },
        },
        // Rule 2: AWS Managed — Known Bad Inputs
        {
          name: "AWSManagedRulesKnownBadInputsRuleSet",
          priority: 2,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: "AWS",
              name: "AWSManagedRulesKnownBadInputsRuleSet",
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: "knownBadInputs",
          },
        },
        // Rule 3: AWS Managed — SQL Injection Protection
        {
          name: "AWSManagedRulesSQLiRuleSet",
          priority: 3,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: "AWS",
              name: "AWSManagedRulesSQLiRuleSet",
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: "sqliRuleSet",
          },
        },
        // Rule 4: Rate-based rule — max 1000 requests per 5 minutes per IP
        {
          name: "RateLimitPerIP",
          priority: 4,
          action: { block: {} },
          statement: {
            rateBasedStatement: {
              limit: 1000,
              aggregateKeyType: "IP",
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: "rateLimitPerIP",
          },
        },
        // Rule 5: AWS Managed — Bot Control (optional, costs extra)
        // Uncomment if you want bot protection:
        // {
        //   name: "AWSManagedRulesBotControlRuleSet",
        //   priority: 5,
        //   overrideAction: { none: {} },
        //   statement: {
        //     managedRuleGroupStatement: {
        //       vendorName: "AWS",
        //       name: "AWSManagedRulesBotControlRuleSet",
        //     },
        //   },
        //   visibilityConfig: {
        //     sampledRequestsEnabled: true,
        //     cloudWatchMetricsEnabled: true,
        //     metricName: "botControl",
        //   },
        // },
      ],
    });

    // ── Secrets Manager ──
    // Store sensitive configuration securely
    this.appSecrets = new secretsmanager.Secret(this, "AppSecrets", {
      secretName: "xpt-store/app-secrets",
      description: "XPT-Store application secrets",
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          JWT_SECRET: "",
          STRIPE_SECRET_KEY: "",
          STRIPE_WEBHOOK_SECRET: "",
          GOOGLE_CLIENT_ID: "",
          GOOGLE_CLIENT_SECRET: "",
          APPLE_CLIENT_ID: "",
          APPLE_CLIENT_SECRET: "",
        }),
        generateStringKey: "JWT_SECRET", // Auto-generate a secure JWT secret
        excludePunctuation: false,
        passwordLength: 64,
      },
    });

    // Outputs
    new cdk.CfnOutput(this, "WebAclArn", {
      value: this.webAcl.attrArn,
      description: "WAF Web ACL ARN — attach to API Gateway",
    });

    new cdk.CfnOutput(this, "SecretsArn", {
      value: this.appSecrets.secretArn,
      description: "Secrets Manager ARN",
    });
  }
}
