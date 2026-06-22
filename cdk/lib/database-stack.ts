import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

export class DatabaseStack extends cdk.Stack {
  public readonly tables: Record<string, dynamodb.Table>;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.tables = {};

    // 1. store_users
    this.tables.users = new dynamodb.Table(this, "UsersTable", {
      tableName: "store_users",
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    this.tables.users.addGlobalSecondaryIndex({
      indexName: "email-index",
      partitionKey: { name: "email", type: dynamodb.AttributeType.STRING },
    });
    this.tables.users.addGlobalSecondaryIndex({
      indexName: "googleId-index",
      partitionKey: { name: "googleId", type: dynamodb.AttributeType.STRING },
    });
    this.tables.users.addGlobalSecondaryIndex({
      indexName: "appleId-index",
      partitionKey: { name: "appleId", type: dynamodb.AttributeType.STRING },
    });
    this.tables.users.addGlobalSecondaryIndex({
      indexName: "role-createdAt-index",
      partitionKey: { name: "role", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "createdAt", type: dynamodb.AttributeType.STRING },
    });

    // 2. store_sessions
    this.tables.sessions = new dynamodb.Table(this, "SessionsTable", {
      tableName: "store_sessions",
      partitionKey: { name: "sessionToken", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    this.tables.sessions.addGlobalSecondaryIndex({
      indexName: "userId-index",
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
    });

    // 4. store_verification_tokens (NextAuth)
    this.tables.verificationTokens = new dynamodb.Table(this, "VerificationTokensTable", {
      tableName: "store_verification_tokens",
      partitionKey: { name: "identifier", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "token", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // 5. store_addresses
    this.tables.addresses = new dynamodb.Table(this, "AddressesTable", {
      tableName: "store_addresses",
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "addressId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // 6. store_categories
    this.tables.categories = new dynamodb.Table(this, "CategoriesTable", {
      tableName: "store_categories",
      partitionKey: { name: "categoryId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    this.tables.categories.addGlobalSecondaryIndex({
      indexName: "parentId-sortOrder-index",
      partitionKey: { name: "parentId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "sortOrder", type: dynamodb.AttributeType.NUMBER },
    });
    this.tables.categories.addGlobalSecondaryIndex({
      indexName: "slug-index",
      partitionKey: { name: "slug", type: dynamodb.AttributeType.STRING },
    });

    // 7. store_products
    this.tables.products = new dynamodb.Table(this, "ProductsTable", {
      tableName: "store_products",
      partitionKey: { name: "productId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    this.tables.products.addGlobalSecondaryIndex({
      indexName: "categoryId-createdAt-index",
      partitionKey: { name: "categoryId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "createdAt", type: dynamodb.AttributeType.STRING },
    });
    this.tables.products.addGlobalSecondaryIndex({
      indexName: "slug-index",
      partitionKey: { name: "slug", type: dynamodb.AttributeType.STRING },
    });
    this.tables.products.addGlobalSecondaryIndex({
      indexName: "status-createdAt-index",
      partitionKey: { name: "status", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "createdAt", type: dynamodb.AttributeType.STRING },
    });

    // 8. store_variants
    this.tables.variants = new dynamodb.Table(this, "VariantsTable", {
      tableName: "store_variants",
      partitionKey: { name: "productId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "variantId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    this.tables.variants.addGlobalSecondaryIndex({
      indexName: "sku-index",
      partitionKey: { name: "sku", type: dynamodb.AttributeType.STRING },
    });

    // 9. store_inventory_logs
    this.tables.inventoryLogs = new dynamodb.Table(this, "InventoryLogsTable", {
      tableName: "store_inventory_logs",
      partitionKey: { name: "productVariantKey", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "timestamp", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // 10. store_cart
    this.tables.cart = new dynamodb.Table(this, "CartTable", {
      tableName: "store_cart",
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // 11. store_orders
    this.tables.orders = new dynamodb.Table(this, "OrdersTable", {
      tableName: "store_orders",
      partitionKey: { name: "orderId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    this.tables.orders.addGlobalSecondaryIndex({
      indexName: "userId-createdAt-index",
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "createdAt", type: dynamodb.AttributeType.STRING },
    });
    this.tables.orders.addGlobalSecondaryIndex({
      indexName: "status-createdAt-index",
      partitionKey: { name: "status", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "createdAt", type: dynamodb.AttributeType.STRING },
    });
    this.tables.orders.addGlobalSecondaryIndex({
      indexName: "orderNumber-index",
      partitionKey: { name: "orderNumber", type: dynamodb.AttributeType.STRING },
    });

    // 12. store_reviews
    this.tables.reviews = new dynamodb.Table(this, "ReviewsTable", {
      tableName: "store_reviews",
      partitionKey: { name: "productId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "reviewId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    this.tables.reviews.addGlobalSecondaryIndex({
      indexName: "userId-createdAt-index",
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "createdAt", type: dynamodb.AttributeType.STRING },
    });
    this.tables.reviews.addGlobalSecondaryIndex({
      indexName: "status-createdAt-index",
      partitionKey: { name: "status", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "createdAt", type: dynamodb.AttributeType.STRING },
    });

    // 13. store_wishlists
    this.tables.wishlists = new dynamodb.Table(this, "WishlistsTable", {
      tableName: "store_wishlists",
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "productId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // 14. store_returns
    this.tables.returns = new dynamodb.Table(this, "ReturnsTable", {
      tableName: "store_returns",
      partitionKey: { name: "returnId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    this.tables.returns.addGlobalSecondaryIndex({
      indexName: "orderId-index",
      partitionKey: { name: "orderId", type: dynamodb.AttributeType.STRING },
    });
    this.tables.returns.addGlobalSecondaryIndex({
      indexName: "userId-requestedAt-index",
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "requestedAt", type: dynamodb.AttributeType.STRING },
    });
    this.tables.returns.addGlobalSecondaryIndex({
      indexName: "status-requestedAt-index",
      partitionKey: { name: "status", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "requestedAt", type: dynamodb.AttributeType.STRING },
    });

    // 15. store_shipping_zones
    this.tables.shippingZones = new dynamodb.Table(this, "ShippingZonesTable", {
      tableName: "store_shipping_zones",
      partitionKey: { name: "zoneId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // 16. store_rfq
    this.tables.rfq = new dynamodb.Table(this, "RfqTable", {
      tableName: "store_rfq",
      partitionKey: { name: "rfqId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    this.tables.rfq.addGlobalSecondaryIndex({
      indexName: "userId-createdAt-index",
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "createdAt", type: dynamodb.AttributeType.STRING },
    });
    this.tables.rfq.addGlobalSecondaryIndex({
      indexName: "status-createdAt-index",
      partitionKey: { name: "status", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "createdAt", type: dynamodb.AttributeType.STRING },
    });

    // 17. store_pages
    this.tables.pages = new dynamodb.Table(this, "PagesTable", {
      tableName: "store_pages",
      partitionKey: { name: "pageId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    this.tables.pages.addGlobalSecondaryIndex({
      indexName: "slug-index",
      partitionKey: { name: "slug", type: dynamodb.AttributeType.STRING },
    });
    this.tables.pages.addGlobalSecondaryIndex({
      indexName: "type-sortOrder-index",
      partitionKey: { name: "type", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "sortOrder", type: dynamodb.AttributeType.NUMBER },
    });

    // 18. store_settings
    this.tables.settings = new dynamodb.Table(this, "SettingsTable", {
      tableName: "store_settings",
      partitionKey: { name: "settingKey", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // 19. store_search_logs
    this.tables.searchLogs = new dynamodb.Table(this, "SearchLogsTable", {
      tableName: "store_search_logs",
      partitionKey: { name: "date", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "timestampSearchId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // 20. store_audit_logs (admin action audit trail)
    this.tables.auditLogs = new dynamodb.Table(this, "AuditLogsTable", {
      tableName: "store_audit_logs",
      partitionKey: { name: "entityType", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "timestampLogId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    this.tables.auditLogs.addGlobalSecondaryIndex({
      indexName: "adminUserId-createdAt-index",
      partitionKey: { name: "adminUserId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "createdAt", type: dynamodb.AttributeType.STRING },
    });
  }
}
