import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import { Construct } from "constructs";
import * as path from "path";

export class FrontendStack extends cdk.Stack {
  public readonly bucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 bucket for frontend static files
    this.bucket = new s3.Bucket(this, "FrontendBucket", {
      bucketName: `xpt-store-frontend-${this.account}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // CloudFront Function for SPA routing
    // Handles: locale redirect, dynamic route rewrites, trailing slash
    const routingFunction = new cloudfront.Function(this, "RoutingFunction", {
      functionName: "xpt-store-spa-routing",
      comment: "SPA routing: locale redirect + dynamic route rewrites",
      code: cloudfront.FunctionCode.fromInline(`
function handler(event) {
  var request = event.request;
  var uri = request.uri;

  // Root redirect → /en/
  if (uri === '/' || uri === '') {
    return {
      statusCode: 302,
      statusDescription: 'Found',
      headers: { location: { value: '/en/' } }
    };
  }

  // If the URI has a file extension, serve as-is (static assets)
  if (uri.match(/\\.[a-zA-Z0-9]+$/)) {
    return request;
  }

  // Ensure trailing slash
  if (!uri.endsWith('/')) {
    uri += '/';
  }

  // Dynamic route rewriting patterns
  // Format: [pattern, rewrite]
  // Storefront dynamic routes (under /en/ or /zh-CN/)
  var localePattern = /^\\/(en|zh-CN)\\//;
  var localeMatch = uri.match(localePattern);

  if (localeMatch) {
    var locale = localeMatch[1];
    var rest = uri.substring(locale.length + 2); // strip /{locale}/

    // /products/{slug}/ → /products/__/
    if (rest.match(/^products\\/[^\\/]+\\/$/)) {
      request.uri = '/' + locale + '/products/__/index.html';
      return request;
    }
    // /categories/{slug}/ → /categories/__/
    if (rest.match(/^categories\\/[^\\/]+\\/$/)) {
      request.uri = '/' + locale + '/categories/__/index.html';
      return request;
    }
    // /pages/{slug}/ → /pages/__/
    if (rest.match(/^pages\\/[^\\/]+\\/$/)) {
      request.uri = '/' + locale + '/pages/__/index.html';
      return request;
    }
    // /account/orders/{id}/ → /account/orders/__/
    if (rest.match(/^account\\/orders\\/[^\\/]+\\/$/)) {
      request.uri = '/' + locale + '/account/orders/__/index.html';
      return request;
    }
  }

  // Admin dynamic routes (no locale prefix)
  // /admin/products/{id}/ → /admin/products/__/
  if (uri.match(/^\\/admin\\/products\\/[^\\/]+\\/$/)) {
    request.uri = '/admin/products/__/index.html';
    return request;
  }
  // /admin/orders/{id}/
  if (uri.match(/^\\/admin\\/orders\\/[^\\/]+\\/$/)) {
    request.uri = '/admin/orders/__/index.html';
    return request;
  }
  // /admin/pages/{id}/
  if (uri.match(/^\\/admin\\/pages\\/[^\\/]+\\/$/)) {
    request.uri = '/admin/pages/__/index.html';
    return request;
  }
  // /admin/users/{id}/
  if (uri.match(/^\\/admin\\/users\\/[^\\/]+\\/$/)) {
    request.uri = '/admin/users/__/index.html';
    return request;
  }
  // /admin/returns/{id}/
  if (uri.match(/^\\/admin\\/returns\\/[^\\/]+\\/$/)) {
    request.uri = '/admin/returns/__/index.html';
    return request;
  }

  // For all other paths, append index.html
  if (!uri.endsWith('index.html')) {
    request.uri = uri + 'index.html';
  }

  return request;
}
      `),
    });

    // CloudFront distribution
    this.distribution = new cloudfront.Distribution(this, "FrontendCdn", {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(this.bucket),
        viewerProtocolPolicy:
          cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        functionAssociations: [
          {
            function: routingFunction,
            eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
          },
        ],
      },
      // Custom error responses for SPA fallback
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: "/en/index.html",
          ttl: cdk.Duration.seconds(0),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: "/en/index.html",
          ttl: cdk.Duration.seconds(0),
        },
      ],
      comment: "XPT-Store frontend",
      defaultRootObject: "",
    });

    // Outputs
    new cdk.CfnOutput(this, "FrontendBucketName", {
      value: this.bucket.bucketName,
    });
    new cdk.CfnOutput(this, "FrontendUrl", {
      value: `https://${this.distribution.distributionDomainName}`,
    });
    new cdk.CfnOutput(this, "DistributionId", {
      value: this.distribution.distributionId,
    });
  }
}
