import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
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

    // Shared environment variables for all Lambda functions
    const commonEnv: Record<string, string> = {
      REGION: this.region,
      S3_BUCKET_NAME: bucket.bucketName,
      CLOUDFRONT_DOMAIN: distribution.distributionDomainName,
    };

    // Shared Lambda layer for common code (optional, can bundle instead)
    const backendCodePath = path.join(__dirname, "../../backend/dist");

    // API Gateway
    const api = new apigateway.RestApi(this, "StoreApi", {
      restApiName: "XPT-Store API",
      description: "XPT-Store backend API",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS, // Restrict in production
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ["Content-Type", "Authorization"],
      },
    });

    // Helper to create Lambda functions
    const createFunction = (
      name: string,
      handler: string,
      extraEnv?: Record<string, string>
    ): lambda.Function => {
      const fn = new lambda.Function(this, name, {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler,
        code: lambda.Code.fromAsset(backendCodePath),
        environment: { ...commonEnv, ...extraEnv },
        timeout: cdk.Duration.seconds(30),
        memorySize: 256,
      });

      // Grant access to all DynamoDB tables
      Object.values(tables).forEach((table) => {
        table.grantReadWriteData(fn);
      });

      // Grant S3 access
      bucket.grantReadWrite(fn);

      return fn;
    };

    // ── Products ──
    const productsResource = api.root.addResource("products");
    const productResource = productsResource.addResource("{id}");

    const listProducts = createFunction("ListProducts", "functions/products/list.handler");
    const getProduct = createFunction("GetProduct", "functions/products/get.handler");

    const createProductFn = createFunction("CreateProduct", "functions/products/create.handler", {
      JWT_SECRET: process.env.JWT_SECRET || "change-me-in-production",
    });
    const updateProductFn = createFunction("UpdateProduct", "functions/products/update.handler", {
      JWT_SECRET: process.env.JWT_SECRET || "change-me-in-production",
    });
    const deleteProductFn = createFunction("DeleteProduct", "functions/products/delete.handler", {
      JWT_SECRET: process.env.JWT_SECRET || "change-me-in-production",
    });

    productsResource.addMethod("GET", new apigateway.LambdaIntegration(listProducts));
    productsResource.addMethod("POST", new apigateway.LambdaIntegration(createProductFn));
    productResource.addMethod("GET", new apigateway.LambdaIntegration(getProduct));
    productResource.addMethod("PUT", new apigateway.LambdaIntegration(updateProductFn));
    productResource.addMethod("DELETE", new apigateway.LambdaIntegration(deleteProductFn));

    // ── Variants ──
    const variantsResource = productResource.addResource("variants");
    const variantResource = variantsResource.addResource("{variantId}");

    const listVariants = createFunction("ListVariants", "functions/variants/list.handler");
    const createVariantFn = createFunction("CreateVariant", "functions/variants/create.handler", {
      JWT_SECRET: process.env.JWT_SECRET || "change-me-in-production",
    });
    const updateVariantFn = createFunction("UpdateVariant", "functions/variants/update.handler", {
      JWT_SECRET: process.env.JWT_SECRET || "change-me-in-production",
    });
    const deleteVariantFn = createFunction("DeleteVariant", "functions/variants/delete.handler", {
      JWT_SECRET: process.env.JWT_SECRET || "change-me-in-production",
    });

    variantsResource.addMethod("GET", new apigateway.LambdaIntegration(listVariants));
    variantsResource.addMethod("POST", new apigateway.LambdaIntegration(createVariantFn));
    variantResource.addMethod("PUT", new apigateway.LambdaIntegration(updateVariantFn));
    variantResource.addMethod("DELETE", new apigateway.LambdaIntegration(deleteVariantFn));

    // ── Auth ──
    const authResource = api.root.addResource("auth");

    const authRegister = createFunction("AuthRegister", "functions/auth/register.handler", {
      JWT_SECRET: process.env.JWT_SECRET || "change-me-in-production",
    });
    const authLogin = createFunction("AuthLogin", "functions/auth/login.handler", {
      JWT_SECRET: process.env.JWT_SECRET || "change-me-in-production",
    });
    const authMe = createFunction("AuthMe", "functions/auth/me.handler", {
      JWT_SECRET: process.env.JWT_SECRET || "change-me-in-production",
    });
    const authRefresh = createFunction("AuthRefresh", "functions/auth/refresh.handler", {
      JWT_SECRET: process.env.JWT_SECRET || "change-me-in-production",
    });
    const authForgotPassword = createFunction("AuthForgotPassword", "functions/auth/forgot-password.handler", {
      JWT_SECRET: process.env.JWT_SECRET || "change-me-in-production",
    });

    authResource.addResource("register").addMethod("POST", new apigateway.LambdaIntegration(authRegister));
    authResource.addResource("login").addMethod("POST", new apigateway.LambdaIntegration(authLogin));
    authResource.addResource("me").addMethod("GET", new apigateway.LambdaIntegration(authMe));
    authResource.addResource("refresh").addMethod("POST", new apigateway.LambdaIntegration(authRefresh));
    authResource.addResource("forgot-password").addMethod("POST", new apigateway.LambdaIntegration(authForgotPassword));

    // ── Upload ──
    const uploadResource = api.root.addResource("upload");
    const uploadPresign = createFunction("UploadPresign", "functions/upload/presign.handler", {
      JWT_SECRET: process.env.JWT_SECRET || "change-me-in-production",
    });
    uploadResource.addResource("presign").addMethod("POST", new apigateway.LambdaIntegration(uploadPresign));

    // ── Categories ──
    const categoriesResource = api.root.addResource("categories");
    const categoryResource = categoriesResource.addResource("{id}");

    const listCategories = createFunction("ListCategories", "functions/categories/list.handler");
    const getCategory = createFunction("GetCategory", "functions/categories/get.handler");
    const createCategoryFn = createFunction("CreateCategory", "functions/categories/create.handler", {
      JWT_SECRET: process.env.JWT_SECRET || "change-me-in-production",
    });
    const updateCategoryFn = createFunction("UpdateCategory", "functions/categories/update.handler", {
      JWT_SECRET: process.env.JWT_SECRET || "change-me-in-production",
    });
    const deleteCategoryFn = createFunction("DeleteCategory", "functions/categories/delete.handler", {
      JWT_SECRET: process.env.JWT_SECRET || "change-me-in-production",
    });

    categoriesResource.addMethod("GET", new apigateway.LambdaIntegration(listCategories));
    categoriesResource.addMethod("POST", new apigateway.LambdaIntegration(createCategoryFn));
    categoryResource.addMethod("GET", new apigateway.LambdaIntegration(getCategory));
    categoryResource.addMethod("PUT", new apigateway.LambdaIntegration(updateCategoryFn));
    categoryResource.addMethod("DELETE", new apigateway.LambdaIntegration(deleteCategoryFn));

    // ── Reviews ──
    const reviewsResource = productResource.addResource("reviews");

    const listReviews = createFunction("ListReviews", "functions/reviews/list.handler");
    const createReviewFn = createFunction("CreateReview", "functions/reviews/create.handler", {
      JWT_SECRET: process.env.JWT_SECRET || "change-me-in-production",
    });

    reviewsResource.addMethod("GET", new apigateway.LambdaIntegration(listReviews));
    reviewsResource.addMethod("POST", new apigateway.LambdaIntegration(createReviewFn));

    // ── Search ──
    const searchResource = api.root.addResource("search");

    const searchQuery = createFunction("SearchQuery", "functions/search/query.handler", {
      JWT_SECRET: process.env.JWT_SECRET || "change-me-in-production",
      OPENSEARCH_ENDPOINT: process.env.OPENSEARCH_ENDPOINT || "",
    });

    searchResource.addMethod("GET", new apigateway.LambdaIntegration(searchQuery));

    // ── Cart ──
    const cartResource = api.root.addResource("cart");

    const getCartFn = createFunction("GetCart", "functions/cart/get.handler", {
      JWT_SECRET: process.env.JWT_SECRET || "change-me-in-production",
    });
    const upsertCartFn = createFunction("UpsertCart", "functions/cart/upsert.handler", {
      JWT_SECRET: process.env.JWT_SECRET || "change-me-in-production",
    });
    const addCartItemFn = createFunction("AddCartItem", "functions/cart/add-item.handler", {
      JWT_SECRET: process.env.JWT_SECRET || "change-me-in-production",
    });
    const clearCartFn = createFunction("ClearCart", "functions/cart/clear.handler", {
      JWT_SECRET: process.env.JWT_SECRET || "change-me-in-production",
    });

    cartResource.addMethod("GET", new apigateway.LambdaIntegration(getCartFn));
    cartResource.addMethod("PUT", new apigateway.LambdaIntegration(upsertCartFn));
    cartResource.addMethod("POST", new apigateway.LambdaIntegration(addCartItemFn));
    cartResource.addMethod("DELETE", new apigateway.LambdaIntegration(clearCartFn));

    const cartItemResource = cartResource.addResource("{productId}");
    const removeCartItemFn = createFunction("RemoveCartItem", "functions/cart/remove-item.handler", {
      JWT_SECRET: process.env.JWT_SECRET || "change-me-in-production",
    });
    cartItemResource.addMethod("DELETE", new apigateway.LambdaIntegration(removeCartItemFn));

    // ── Orders ──
    const ordersResource = api.root.addResource("orders");
    const orderResource = ordersResource.addResource("{id}");

    const createOrderFn = createFunction("CreateOrder", "functions/orders/create.handler", {
      JWT_SECRET: process.env.JWT_SECRET || "change-me-in-production",
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || "",
    });
    const getOrderFn = createFunction("GetOrder", "functions/orders/get.handler", {
      JWT_SECRET: process.env.JWT_SECRET || "change-me-in-production",
    });
    const listOrdersFn = createFunction("ListOrders", "functions/orders/list.handler", {
      JWT_SECRET: process.env.JWT_SECRET || "change-me-in-production",
    });

    ordersResource.addMethod("POST", new apigateway.LambdaIntegration(createOrderFn));
    ordersResource.addMethod("GET", new apigateway.LambdaIntegration(listOrdersFn));
    orderResource.addMethod("GET", new apigateway.LambdaIntegration(getOrderFn));

    // ── Shipping ──
    const shippingResource = api.root.addResource("shipping");
    const calculateShippingFn = createFunction("CalculateShipping", "functions/shipping/calculate.handler");
    shippingResource.addResource("calculate").addMethod("POST", new apigateway.LambdaIntegration(calculateShippingFn));

    // ── Webhooks ──
    const webhooksResource = api.root.addResource("webhooks");
    const stripeWebhookFn = createFunction("StripeWebhook", "functions/webhooks/stripe.handler", {
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || "",
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || "",
    });
    webhooksResource.addResource("stripe").addMethod("POST", new apigateway.LambdaIntegration(stripeWebhookFn));

    // ── Users (Account) ──
    const usersResource = api.root.addResource("users");
    const userMeResource = usersResource.addResource("me");

    const getProfileFn = createFunction("GetProfile", "functions/users/get-profile.handler", {
      JWT_SECRET: process.env.JWT_SECRET || "change-me-in-production",
    });
    const updateProfileFn = createFunction("UpdateProfile", "functions/users/update-profile.handler", {
      JWT_SECRET: process.env.JWT_SECRET || "change-me-in-production",
    });
    const userProfileResource = userMeResource.addResource("profile");
    userProfileResource.addMethod("GET", new apigateway.LambdaIntegration(getProfileFn));
    userProfileResource.addMethod("PUT", new apigateway.LambdaIntegration(updateProfileFn));

    // Addresses
    const userAddressesResource = userMeResource.addResource("addresses");
    const userAddressResource = userAddressesResource.addResource("{addressId}");

    const listAddressesFn = createFunction("ListAddresses", "functions/users/list-addresses.handler", {
      JWT_SECRET: process.env.JWT_SECRET || "change-me-in-production",
    });
    const createAddressFn = createFunction("CreateAddress", "functions/users/create-address.handler", {
      JWT_SECRET: process.env.JWT_SECRET || "change-me-in-production",
    });
    const updateAddressFn = createFunction("UpdateAddress", "functions/users/update-address.handler", {
      JWT_SECRET: process.env.JWT_SECRET || "change-me-in-production",
    });
    const deleteAddressFn = createFunction("DeleteAddress", "functions/users/delete-address.handler", {
      JWT_SECRET: process.env.JWT_SECRET || "change-me-in-production",
    });

    userAddressesResource.addMethod("GET", new apigateway.LambdaIntegration(listAddressesFn));
    userAddressesResource.addMethod("POST", new apigateway.LambdaIntegration(createAddressFn));
    userAddressResource.addMethod("PUT", new apigateway.LambdaIntegration(updateAddressFn));
    userAddressResource.addMethod("DELETE", new apigateway.LambdaIntegration(deleteAddressFn));

    // Wishlist
    const userWishlistResource = userMeResource.addResource("wishlist");
    const userWishlistItemResource = userWishlistResource.addResource("{productId}");

    const getWishlistFn = createFunction("GetWishlist", "functions/users/get-wishlist.handler", {
      JWT_SECRET: process.env.JWT_SECRET || "change-me-in-production",
    });
    const addWishlistFn = createFunction("AddWishlist", "functions/users/add-wishlist.handler", {
      JWT_SECRET: process.env.JWT_SECRET || "change-me-in-production",
    });
    const removeWishlistFn = createFunction("RemoveWishlist", "functions/users/remove-wishlist.handler", {
      JWT_SECRET: process.env.JWT_SECRET || "change-me-in-production",
    });

    userWishlistResource.addMethod("GET", new apigateway.LambdaIntegration(getWishlistFn));
    userWishlistResource.addMethod("POST", new apigateway.LambdaIntegration(addWishlistFn));
    userWishlistItemResource.addMethod("DELETE", new apigateway.LambdaIntegration(removeWishlistFn));

    // User orders & reviews
    const userOrdersFn = createFunction("UserOrders", "functions/users/list-orders.handler", {
      JWT_SECRET: process.env.JWT_SECRET || "change-me-in-production",
    });
    const userReviewsFn = createFunction("UserReviews", "functions/users/list-reviews.handler", {
      JWT_SECRET: process.env.JWT_SECRET || "change-me-in-production",
    });

    userMeResource.addResource("orders").addMethod("GET", new apigateway.LambdaIntegration(userOrdersFn));
    userMeResource.addResource("reviews").addMethod("GET", new apigateway.LambdaIntegration(userReviewsFn));

    // ── Shipping Zones (Admin) ──
    const shippingZonesResource = shippingResource.addResource("zones");
    const shippingZoneResource = shippingZonesResource.addResource("{zoneId}");

    const listZonesFn = createFunction("ListShippingZones", "functions/shipping/list-zones.handler");
    const getZoneFn = createFunction("GetShippingZone", "functions/shipping/get-zone.handler");
    const createZoneFn = createFunction("CreateShippingZone", "functions/shipping/create-zone.handler", {
      JWT_SECRET: process.env.JWT_SECRET || "change-me-in-production",
    });
    const updateZoneFn = createFunction("UpdateShippingZone", "functions/shipping/update-zone.handler", {
      JWT_SECRET: process.env.JWT_SECRET || "change-me-in-production",
    });
    const deleteZoneFn = createFunction("DeleteShippingZone", "functions/shipping/delete-zone.handler", {
      JWT_SECRET: process.env.JWT_SECRET || "change-me-in-production",
    });

    shippingZonesResource.addMethod("GET", new apigateway.LambdaIntegration(listZonesFn));
    shippingZonesResource.addMethod("POST", new apigateway.LambdaIntegration(createZoneFn));
    shippingZoneResource.addMethod("GET", new apigateway.LambdaIntegration(getZoneFn));
    shippingZoneResource.addMethod("PUT", new apigateway.LambdaIntegration(updateZoneFn));
    shippingZoneResource.addMethod("DELETE", new apigateway.LambdaIntegration(deleteZoneFn));

    // ── Orders (Admin) ──
    const updateOrderFn = createFunction("UpdateOrder", "functions/orders/update.handler", {
      JWT_SECRET: process.env.JWT_SECRET || "change-me-in-production",
    });
    const listAdminOrdersFn = createFunction("ListAdminOrders", "functions/orders/list-admin.handler", {
      JWT_SECRET: process.env.JWT_SECRET || "change-me-in-production",
    });
    const exportOrdersFn = createFunction("ExportOrders", "functions/orders/export.handler", {
      JWT_SECRET: process.env.JWT_SECRET || "change-me-in-production",
    });

    orderResource.addMethod("PUT", new apigateway.LambdaIntegration(updateOrderFn));
    const adminOrdersResource = api.root.addResource("admin").addResource("orders");
    adminOrdersResource.addMethod("GET", new apigateway.LambdaIntegration(listAdminOrdersFn));
    adminOrdersResource.addResource("export").addMethod("GET", new apigateway.LambdaIntegration(exportOrdersFn));

    // ── Returns ──
    const returnsResource = api.root.addResource("returns");
    const returnResource = returnsResource.addResource("{id}");

    const createReturnFn = createFunction("CreateReturn", "functions/returns/create.handler", {
      JWT_SECRET: process.env.JWT_SECRET || "change-me-in-production",
    });
    const listReturnsFn = createFunction("ListReturns", "functions/returns/list.handler", {
      JWT_SECRET: process.env.JWT_SECRET || "change-me-in-production",
    });
    const getReturnFn = createFunction("GetReturn", "functions/returns/get.handler", {
      JWT_SECRET: process.env.JWT_SECRET || "change-me-in-production",
    });
    const updateReturnFn = createFunction("UpdateReturn", "functions/returns/update.handler", {
      JWT_SECRET: process.env.JWT_SECRET || "change-me-in-production",
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || "",
    });

    returnsResource.addMethod("POST", new apigateway.LambdaIntegration(createReturnFn));
    returnsResource.addMethod("GET", new apigateway.LambdaIntegration(listReturnsFn));
    returnResource.addMethod("GET", new apigateway.LambdaIntegration(getReturnFn));
    returnResource.addMethod("PUT", new apigateway.LambdaIntegration(updateReturnFn));

    // ── Inventory (Admin) ──
    const inventoryResource = api.root.addResource("inventory");

    const listInventoryFn = createFunction("ListInventory", "functions/inventory/list.handler", {
      JWT_SECRET: process.env.JWT_SECRET || "change-me-in-production",
    });
    const updateStockFn = createFunction("UpdateStock", "functions/inventory/update-stock.handler", {
      JWT_SECRET: process.env.JWT_SECRET || "change-me-in-production",
    });

    inventoryResource.addMethod("GET", new apigateway.LambdaIntegration(listInventoryFn));
    inventoryResource.addResource("{productId}").addResource("stock").addMethod(
      "PUT",
      new apigateway.LambdaIntegration(updateStockFn)
    );

    // ── Users (Admin) ──
    const listUsersFn = createFunction("ListUsers", "functions/users/list.handler", {
      JWT_SECRET: process.env.JWT_SECRET || "change-me-in-production",
    });
    const getUserFn = createFunction("GetUser", "functions/users/get.handler", {
      JWT_SECRET: process.env.JWT_SECRET || "change-me-in-production",
    });
    const updateRoleFn = createFunction("UpdateUserRole", "functions/users/update-role.handler", {
      JWT_SECRET: process.env.JWT_SECRET || "change-me-in-production",
    });

    usersResource.addMethod("GET", new apigateway.LambdaIntegration(listUsersFn));
    const userIdResource = usersResource.addResource("{userId}");
    userIdResource.addMethod("GET", new apigateway.LambdaIntegration(getUserFn));
    userIdResource.addResource("role").addMethod("PUT", new apigateway.LambdaIntegration(updateRoleFn));

    // ── Reviews (Admin) ──
    const adminReviewsResource = api.root.addResource("reviews");

    const listAdminReviewsFn = createFunction("ListAdminReviews", "functions/reviews/list-admin.handler", {
      JWT_SECRET: process.env.JWT_SECRET || "change-me-in-production",
    });
    const updateReviewStatusFn = createFunction("UpdateReviewStatus", "functions/reviews/update-status.handler", {
      JWT_SECRET: process.env.JWT_SECRET || "change-me-in-production",
    });

    adminReviewsResource.addMethod("GET", new apigateway.LambdaIntegration(listAdminReviewsFn));
    adminReviewsResource.addResource("{reviewId}").addResource("status").addMethod(
      "PUT",
      new apigateway.LambdaIntegration(updateReviewStatusFn)
    );

    // ── RFQ ──
    const rfqResource = api.root.addResource("rfq");
    const rfqItemResource = rfqResource.addResource("{id}");

    const createRfqFn = createFunction("CreateRfq", "functions/rfq/create.handler", {
      JWT_SECRET: process.env.JWT_SECRET || "change-me-in-production",
    });
    const listRfqFn = createFunction("ListRfq", "functions/rfq/list.handler", {
      JWT_SECRET: process.env.JWT_SECRET || "change-me-in-production",
    });
    const updateRfqStatusFn = createFunction("UpdateRfqStatus", "functions/rfq/update-status.handler", {
      JWT_SECRET: process.env.JWT_SECRET || "change-me-in-production",
    });

    rfqResource.addMethod("POST", new apigateway.LambdaIntegration(createRfqFn));
    rfqResource.addMethod("GET", new apigateway.LambdaIntegration(listRfqFn));
    rfqItemResource.addResource("status").addMethod("PUT", new apigateway.LambdaIntegration(updateRfqStatusFn));

    // ── Pages ──
    const pagesResource = api.root.addResource("pages");
    const pageResource = pagesResource.addResource("{id}");

    const listPagesFn = createFunction("ListPages", "functions/pages/list.handler");
    const getPageFn = createFunction("GetPage", "functions/pages/get.handler");
    const createPageFn = createFunction("CreatePage", "functions/pages/create.handler", {
      JWT_SECRET: process.env.JWT_SECRET || "change-me-in-production",
    });
    const updatePageFn = createFunction("UpdatePage", "functions/pages/update.handler", {
      JWT_SECRET: process.env.JWT_SECRET || "change-me-in-production",
    });
    const deletePageFn = createFunction("DeletePage", "functions/pages/delete.handler", {
      JWT_SECRET: process.env.JWT_SECRET || "change-me-in-production",
    });

    pagesResource.addMethod("GET", new apigateway.LambdaIntegration(listPagesFn));
    pagesResource.addMethod("POST", new apigateway.LambdaIntegration(createPageFn));
    pageResource.addMethod("GET", new apigateway.LambdaIntegration(getPageFn));
    pageResource.addMethod("PUT", new apigateway.LambdaIntegration(updatePageFn));
    pageResource.addMethod("DELETE", new apigateway.LambdaIntegration(deletePageFn));

    // ── Contact ──
    const contactResource = api.root.addResource("contact");
    const sendContactFn = createFunction("SendContact", "functions/contact/send.handler", {
      SES_FROM_EMAIL: process.env.SES_FROM_EMAIL || "support@xpt-tech.com",
    });
    contactResource.addMethod("POST", new apigateway.LambdaIntegration(sendContactFn));

    // ── Settings ──
    const settingsResource = api.root.addResource("settings");

    const getSettingsFn = createFunction("GetSettings", "functions/settings/get.handler");
    const updateSettingsFn = createFunction("UpdateSettings", "functions/settings/update.handler", {
      JWT_SECRET: process.env.JWT_SECRET || "change-me-in-production",
    });

    settingsResource.addMethod("GET", new apigateway.LambdaIntegration(getSettingsFn));
    settingsResource.addMethod("PUT", new apigateway.LambdaIntegration(updateSettingsFn));

    // ── Invoices ──
    const invoicesResource = api.root.addResource("invoices");
    const getInvoiceFn = createFunction("GetInvoice", "functions/invoices/get.handler", {
      JWT_SECRET: process.env.JWT_SECRET || "change-me-in-production",
    });
    invoicesResource.addResource("{orderId}").addMethod("GET", new apigateway.LambdaIntegration(getInvoiceFn));

    // Output
    new cdk.CfnOutput(this, "ApiUrl", {
      value: api.url,
      description: "API Gateway URL",
    });
  }
}
