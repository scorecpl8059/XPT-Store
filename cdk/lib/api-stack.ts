import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import { Construct } from "constructs";
import * as path from "path";

interface ApiStackProps extends cdk.StackProps {
  tables: Record<string, dynamodb.Table>;
  bucket: s3.Bucket;
  distribution: cloudfront.Distribution;
}

export class ApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const { tables, bucket, distribution } = props;

    const backendCodePath = path.join(__dirname, "../../backend/dist");

    // Shared Lambda execution role (reduces IAM resource count from 150+ to 1)
    const lambdaRole = new iam.Role(this, "LambdaRole", {
      roleName: "xpt-store-lambda-execution",
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"),
      ],
    });

    // Grant DynamoDB access
    Object.values(tables).forEach((table) => {
      table.grantReadWriteData(lambdaRole);
    });

    // Grant S3 access
    bucket.grantReadWrite(lambdaRole);

    // Shared environment
    const commonEnv: Record<string, string> = {
      REGION: this.region,
      S3_BUCKET_NAME: bucket.bucketName,
      CLOUDFRONT_DOMAIN: distribution.distributionDomainName,
      JWT_SECRET: process.env.JWT_SECRET || "change-me-in-production",
    };

    // Single code asset shared by all functions
    const code = lambda.Code.fromAsset(backendCodePath);

    // Helper — creates a function sharing the role and code asset
    const fn = (name: string, handler: string, extraEnv?: Record<string, string>): lambda.Function => {
      // Convert PascalCase construct ID to kebab-case function name
      const kebab = name.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
      return new lambda.Function(this, name, {
        functionName: `xpt-store-${kebab}`,
        runtime: lambda.Runtime.NODEJS_20_X,
        handler,
        code,
        role: lambdaRole,
        environment: { ...commonEnv, ...extraEnv },
        timeout: cdk.Duration.seconds(30),
        memorySize: 256,
      });
    };

    // API Gateway
    const api = new apigateway.RestApi(this, "StoreApi", {
      restApiName: "XPT-Store API",
      description: "XPT-Store backend API",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ["Content-Type", "Authorization"],
      },
    });

    const li = (f: lambda.Function) => new apigateway.LambdaIntegration(f);

    // ── Auth ──
    const auth = api.root.addResource("auth");
    auth.addResource("register").addMethod("POST", li(fn("AuthRegister", "functions/auth/register.handler")));
    auth.addResource("login").addMethod("POST", li(fn("AuthLogin", "functions/auth/login.handler")));
    auth.addResource("me").addMethod("GET", li(fn("AuthMe", "functions/auth/me.handler")));
    auth.addResource("refresh").addMethod("POST", li(fn("AuthRefresh", "functions/auth/refresh.handler")));
    auth.addResource("forgot-password").addMethod("POST", li(fn("AuthForgotPw", "functions/auth/forgot-password.handler")));

    // ── Products ──
    const products = api.root.addResource("products");
    const product = products.addResource("{id}");
    products.addMethod("GET", li(fn("ListProducts", "functions/products/list.handler")));
    products.addMethod("POST", li(fn("CreateProduct", "functions/products/create.handler")));
    product.addMethod("GET", li(fn("GetProduct", "functions/products/get.handler")));
    product.addMethod("PUT", li(fn("UpdateProduct", "functions/products/update.handler")));
    product.addMethod("DELETE", li(fn("DeleteProduct", "functions/products/delete.handler")));

    // Variants
    const variants = product.addResource("variants");
    const variant = variants.addResource("{variantId}");
    variants.addMethod("GET", li(fn("ListVariants", "functions/variants/list.handler")));
    variants.addMethod("POST", li(fn("CreateVariant", "functions/variants/create.handler")));
    variant.addMethod("PUT", li(fn("UpdateVariant", "functions/variants/update.handler")));
    variant.addMethod("DELETE", li(fn("DeleteVariant", "functions/variants/delete.handler")));

    // Reviews (under product)
    const reviews = product.addResource("reviews");
    reviews.addMethod("GET", li(fn("ListReviews", "functions/reviews/list.handler")));
    reviews.addMethod("POST", li(fn("CreateReview", "functions/reviews/create.handler")));

    // ── Categories ──
    const categories = api.root.addResource("categories");
    const category = categories.addResource("{id}");
    categories.addMethod("GET", li(fn("ListCategories", "functions/categories/list.handler")));
    categories.addMethod("POST", li(fn("CreateCategory", "functions/categories/create.handler")));
    category.addMethod("GET", li(fn("GetCategory", "functions/categories/get.handler")));
    category.addMethod("PUT", li(fn("UpdateCategory", "functions/categories/update.handler")));
    category.addMethod("DELETE", li(fn("DeleteCategory", "functions/categories/delete.handler")));

    // ── Search ──
    api.root.addResource("search").addMethod("GET", li(fn("SearchQuery", "functions/search/query.handler", {
      OPENSEARCH_ENDPOINT: process.env.OPENSEARCH_ENDPOINT || "",
    })));

    // ── Upload ──
    api.root.addResource("upload").addResource("presign").addMethod("POST", li(fn("UploadPresign", "functions/upload/presign.handler")));

    // ── Cart ──
    const cart = api.root.addResource("cart");
    cart.addMethod("GET", li(fn("GetCart", "functions/cart/get.handler")));
    cart.addMethod("PUT", li(fn("UpsertCart", "functions/cart/upsert.handler")));
    cart.addMethod("POST", li(fn("AddCartItem", "functions/cart/add-item.handler")));
    cart.addMethod("DELETE", li(fn("ClearCart", "functions/cart/clear.handler")));
    cart.addResource("{productId}").addMethod("DELETE", li(fn("RemoveCartItem", "functions/cart/remove-item.handler")));

    // ── Orders ──
    const orders = api.root.addResource("orders");
    const order = orders.addResource("{id}");
    orders.addMethod("POST", li(fn("CreateOrder", "functions/orders/create.handler", {
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || "",
    })));
    orders.addMethod("GET", li(fn("ListOrders", "functions/orders/list.handler")));
    order.addMethod("GET", li(fn("GetOrder", "functions/orders/get.handler")));
    order.addMethod("PUT", li(fn("UpdateOrder", "functions/orders/update.handler")));

    // ── Shipping ──
    const shipping = api.root.addResource("shipping");
    shipping.addResource("calculate").addMethod("POST", li(fn("CalcShipping", "functions/shipping/calculate.handler")));
    const zones = shipping.addResource("zones");
    const zone = zones.addResource("{zoneId}");
    zones.addMethod("GET", li(fn("ListZones", "functions/shipping/list-zones.handler")));
    zones.addMethod("POST", li(fn("CreateZone", "functions/shipping/create-zone.handler")));
    zone.addMethod("GET", li(fn("GetZone", "functions/shipping/get-zone.handler")));
    zone.addMethod("PUT", li(fn("UpdateZone", "functions/shipping/update-zone.handler")));
    zone.addMethod("DELETE", li(fn("DeleteZone", "functions/shipping/delete-zone.handler")));

    // ── Webhooks ──
    api.root.addResource("webhooks").addResource("stripe").addMethod("POST", li(fn("StripeWebhook", "functions/webhooks/stripe.handler", {
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || "",
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || "",
    })));

    // ── Users ──
    const users = api.root.addResource("users");
    const userMe = users.addResource("me");

    const profile = userMe.addResource("profile");
    profile.addMethod("GET", li(fn("GetProfile", "functions/users/get-profile.handler")));
    profile.addMethod("PUT", li(fn("UpdateProfile", "functions/users/update-profile.handler")));

    const addresses = userMe.addResource("addresses");
    const address = addresses.addResource("{addressId}");
    addresses.addMethod("GET", li(fn("ListAddresses", "functions/users/list-addresses.handler")));
    addresses.addMethod("POST", li(fn("CreateAddress", "functions/users/create-address.handler")));
    address.addMethod("PUT", li(fn("UpdateAddress", "functions/users/update-address.handler")));
    address.addMethod("DELETE", li(fn("DeleteAddress", "functions/users/delete-address.handler")));

    const wishlist = userMe.addResource("wishlist");
    wishlist.addMethod("GET", li(fn("GetWishlist", "functions/users/get-wishlist.handler")));
    wishlist.addMethod("POST", li(fn("AddWishlist", "functions/users/add-wishlist.handler")));
    wishlist.addResource("{productId}").addMethod("DELETE", li(fn("RemoveWishlist", "functions/users/remove-wishlist.handler")));

    userMe.addResource("orders").addMethod("GET", li(fn("UserOrders", "functions/users/list-orders.handler")));
    userMe.addResource("reviews").addMethod("GET", li(fn("UserReviews", "functions/users/list-reviews.handler")));

    // Admin users
    users.addMethod("GET", li(fn("ListUsers", "functions/users/list.handler")));
    const userId = users.addResource("{userId}");
    userId.addMethod("GET", li(fn("GetUser", "functions/users/get.handler")));
    userId.addResource("role").addMethod("PUT", li(fn("UpdateRole", "functions/users/update-role.handler")));

    // ── Returns ──
    const returns = api.root.addResource("returns");
    const ret = returns.addResource("{id}");
    returns.addMethod("POST", li(fn("CreateReturn", "functions/returns/create.handler")));
    returns.addMethod("GET", li(fn("ListReturns", "functions/returns/list.handler")));
    ret.addMethod("GET", li(fn("GetReturn", "functions/returns/get.handler")));
    ret.addMethod("PUT", li(fn("UpdateReturn", "functions/returns/update.handler", {
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || "",
    })));

    // ── RFQ ──
    const rfq = api.root.addResource("rfq");
    rfq.addMethod("POST", li(fn("CreateRfq", "functions/rfq/create.handler")));
    rfq.addMethod("GET", li(fn("ListRfq", "functions/rfq/list.handler")));
    rfq.addResource("{id}").addResource("status").addMethod("PUT", li(fn("UpdateRfqStatus", "functions/rfq/update-status.handler")));

    // ── Admin ──
    const admin = api.root.addResource("admin");
    const adminOrders = admin.addResource("orders");
    adminOrders.addMethod("GET", li(fn("ListAdminOrders", "functions/orders/list-admin.handler")));
    adminOrders.addResource("export").addMethod("GET", li(fn("ExportOrders", "functions/orders/export.handler")));

    // ── Inventory ──
    const inventory = api.root.addResource("inventory");
    inventory.addMethod("GET", li(fn("ListInventory", "functions/inventory/list.handler")));
    inventory.addResource("{productId}").addResource("stock").addMethod("PUT", li(fn("UpdateStock", "functions/inventory/update-stock.handler")));

    // ── Reviews (Admin) ──
    const adminReviews = api.root.addResource("reviews");
    adminReviews.addMethod("GET", li(fn("ListAdminReviews", "functions/reviews/list-admin.handler")));
    adminReviews.addResource("{reviewId}").addResource("status").addMethod("PUT", li(fn("UpdateReviewStatus", "functions/reviews/update-status.handler")));

    // ── Pages ──
    const pages = api.root.addResource("pages");
    const page = pages.addResource("{id}");
    pages.addMethod("GET", li(fn("ListPages", "functions/pages/list.handler")));
    pages.addMethod("POST", li(fn("CreatePage", "functions/pages/create.handler")));
    page.addMethod("GET", li(fn("GetPage", "functions/pages/get.handler")));
    page.addMethod("PUT", li(fn("UpdatePage", "functions/pages/update.handler")));
    page.addMethod("DELETE", li(fn("DeletePage", "functions/pages/delete.handler")));

    // ── Contact ──
    api.root.addResource("contact").addMethod("POST", li(fn("SendContact", "functions/contact/send.handler", {
      SES_FROM_EMAIL: process.env.SES_FROM_EMAIL || "support@xpt-tech.com",
    })));

    // ── Settings ──
    const settings = api.root.addResource("settings");
    settings.addMethod("GET", li(fn("GetSettings", "functions/settings/get.handler")));
    settings.addMethod("PUT", li(fn("UpdateSettings", "functions/settings/update.handler")));

    // ── Invoices ──
    api.root.addResource("invoices").addResource("{orderId}").addMethod("GET", li(fn("GetInvoice", "functions/invoices/get.handler")));

    // Output
    new cdk.CfnOutput(this, "ApiUrl", {
      value: api.url,
      description: "API Gateway URL",
    });
  }
}
