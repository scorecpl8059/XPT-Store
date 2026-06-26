/**
 * Seed script: populates xpt_store_pages with Terms, Privacy, Return Policy, and FAQ entries.
 * Re-running this script updates existing pages (matched by slug).
 *
 * Usage:  npx tsx scripts/seed-pages.ts
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { ulid } from "ulid";

const client = new DynamoDBClient({ region: "us-east-1" });
const docClient = DynamoDBDocumentClient.from(client);
const TABLE = "xpt_store_pages";

interface PageSeed {
  title: string;
  slug: string;
  type: "page" | "faq";
  sortOrder: number;
  content: string;
}

async function findPageBySlug(slug: string): Promise<string | null> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE,
      IndexName: "slug-index",
      KeyConditionExpression: "slug = :slug",
      ExpressionAttributeValues: { ":slug": slug },
      Limit: 1,
    })
  );
  return (result.Items?.[0] as { pageId: string } | undefined)?.pageId ?? null;
}

const pages: PageSeed[] = [
  // ── Legal pages ──
  {
    title: "Terms & Conditions",
    slug: "terms",
    type: "page",
    sortOrder: 1,
    content: `
<h2>1. Introduction</h2>
<p>Welcome to XPT-TECH ("Company", "we", "us", or "our"). These Terms & Conditions govern your use of our website at store.xpt-tech.com and your purchase of products from us.</p>
<p>By accessing or using our website, creating an account, or placing an order, you agree to be bound by these terms. If you do not agree, please do not use our services.</p>

<h2>2. Eligibility</h2>
<p>You must be at least <strong>18 years of age</strong> or the legal age of majority in your jurisdiction to use this website and make purchases. By using our services, you represent and warrant that you meet this requirement.</p>
<p>If you are placing an order on behalf of a business entity, you represent that you have the authority to bind that entity to these terms.</p>

<h2>3. Account Responsibilities</h2>
<p>When you create an account, you are responsible for:</p>
<ul>
  <li>Providing accurate and complete registration information</li>
  <li>Maintaining the confidentiality of your login credentials</li>
  <li>All activities that occur under your account</li>
  <li>Notifying us immediately of any unauthorized use of your account</li>
</ul>
<p>We reserve the right to suspend or terminate accounts that violate these terms or are used for fraudulent purposes.</p>

<h2>4. Products & Pricing</h2>
<p>All prices are listed in <strong>USD</strong> and are subject to change without notice. We make every effort to ensure product descriptions, specifications, and pricing are accurate, but we do not warrant that they are error-free.</p>
<p>In the event of a pricing error, we reserve the right to cancel the order and issue a full refund. We will notify you if this occurs.</p>
<p>We reserve the right to limit quantities, refuse orders, or cancel orders at our discretion, including orders that appear to be placed by dealers, resellers, or distributors.</p>

<h2>5. Orders & Payment</h2>
<p>When you place an order, you will receive an email confirmation acknowledging receipt. This confirmation does not constitute acceptance of your order. Your order is accepted only when we ship the product or send a shipment confirmation.</p>
<p>We accept payment via major credit cards (Visa, MasterCard, American Express) and other payment methods available at checkout. All payments are processed securely through <strong>Stripe</strong>. We do not store your full credit card information on our servers.</p>

<h2>6. Shipping & Delivery</h2>
<p>Shipping times and costs vary depending on your location and the shipping method selected. Estimated delivery dates are provided as a guideline and are <strong>not guaranteed</strong>.</p>
<p>Risk of loss and title for items pass to you upon delivery to the carrier. We are not responsible for delays caused by the shipping carrier, weather, customs, or other circumstances beyond our control.</p>

<h2>7. Returns & Refunds</h2>
<p>Please refer to our <a href="/en/pages/return-policy">Return Policy</a> for complete details on returns, exchanges, and refunds.</p>

<h2>8. Warranty</h2>
<p>Products sold by XPT-TECH are covered by the manufacturer's warranty, if applicable. We do not provide any additional warranty beyond what the manufacturer offers. All products are sold <strong>"as is"</strong> to the extent permitted by law.</p>

<h2>9. Limitation of Liability</h2>
<p>To the fullest extent permitted by applicable law, XPT-TECH shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our products or services, including but not limited to loss of profits, data, or business opportunities.</p>
<p>Our total aggregate liability for any claim arising out of or related to these terms shall not exceed the amount you paid for the specific product giving rise to the claim.</p>

<h2>10. Indemnification</h2>
<p>You agree to indemnify, defend, and hold harmless XPT-TECH, its officers, directors, employees, and agents from any claims, liabilities, damages, losses, or expenses (including reasonable attorney's fees) arising out of your use of our website, violation of these terms, or infringement of any third-party rights.</p>

<h2>11. Intellectual Property</h2>
<p>All content on this website, including text, graphics, logos, images, product descriptions, and software, is the property of XPT-TECH or its licensors and is protected by applicable intellectual property laws. You may not reproduce, distribute, or create derivative works from our content without prior written consent.</p>

<h2>12. Governing Law & Jurisdiction</h2>
<p>These terms shall be governed by and construed in accordance with the laws of the <strong>State of California, United States</strong>, without regard to its conflict of law provisions. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the state and federal courts located in California.</p>

<h2>13. Dispute Resolution</h2>
<p>Before initiating any legal proceeding, you agree to first attempt to resolve any dispute informally by contacting us at support@xpt-tech.com. We will try to resolve the matter within 30 days.</p>
<p>If the dispute cannot be resolved informally, both parties agree to submit to binding arbitration administered by the American Arbitration Association (AAA) under its Commercial Arbitration Rules, except that either party may seek injunctive relief in court for intellectual property disputes.</p>

<h2>14. Severability</h2>
<p>If any provision of these terms is found to be invalid, illegal, or unenforceable by a court of competent jurisdiction, the remaining provisions shall remain in full force and effect. The invalid provision shall be modified to the minimum extent necessary to make it valid and enforceable.</p>

<h2>15. Changes to Terms</h2>
<p>We may update these terms from time to time. Material changes will be posted on this page with a revised "Last Updated" date. Continued use of the website after changes constitutes acceptance of the updated terms.</p>
<p>We encourage you to review these terms periodically.</p>

<h2>16. Contact</h2>
<p>If you have questions about these terms, please contact us:</p>
<ul>
  <li><strong>Email:</strong> support@xpt-tech.com</li>
  <li><strong>Website:</strong> <a href="/en/contact">Contact Page</a></li>
</ul>
`.trim(),
  },

  {
    title: "Privacy Policy",
    slug: "privacy",
    type: "page",
    sortOrder: 2,
    content: `
<h2>1. Introduction</h2>
<p>XPT-TECH ("we", "us", or "our") respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your data when you visit store.xpt-tech.com or make a purchase.</p>
<p>By using our website, you consent to the practices described in this policy.</p>

<h2>2. Information We Collect</h2>
<p><strong>Information you provide directly:</strong></p>
<ul>
  <li>Name, email address, phone number</li>
  <li>Shipping and billing addresses</li>
  <li>Payment information (processed securely by Stripe; we do not store full card numbers)</li>
  <li>Account login credentials</li>
  <li>Order history and preferences</li>
  <li>Communications you send to us (support requests, reviews, RFQ submissions)</li>
  <li>Business information (company name, tax ID) for B2B accounts</li>
</ul>
<p><strong>Information collected automatically:</strong></p>
<ul>
  <li>IP address, browser type, operating system</li>
  <li>Pages visited, time spent on pages, referring URLs</li>
  <li>Device identifiers and screen resolution</li>
  <li>Cookies and similar tracking technologies</li>
</ul>

<h2>3. How We Use Your Information</h2>
<ul>
  <li>Process and fulfill your orders, including shipping and payment</li>
  <li>Send order confirmations, shipping updates, and invoices</li>
  <li>Create and manage your account</li>
  <li>Respond to your inquiries and customer support requests</li>
  <li>Improve our website, products, and services</li>
  <li>Send promotional communications (only with your consent; you can opt out at any time)</li>
  <li>Prevent fraud, unauthorized transactions, and other illegal activities</li>
  <li>Comply with legal obligations</li>
</ul>

<h2>4. Information Sharing</h2>
<p>We do <strong>not sell, rent, or trade</strong> your personal information to third parties. We share your data only with:</p>
<ul>
  <li><strong>Payment processors</strong> (Stripe) — to securely process transactions</li>
  <li><strong>Shipping carriers</strong> (USPS, UPS, FedEx) — to deliver your orders</li>
  <li><strong>Cloud service providers</strong> (Amazon Web Services) — to host and operate our website</li>
  <li><strong>Analytics providers</strong> (Google Analytics) — to understand website usage (anonymized where possible)</li>
  <li><strong>Law enforcement or government agencies</strong> — when required by law, subpoena, or court order</li>
</ul>

<h2>5. Cookies & Tracking</h2>
<p>We use cookies and similar technologies to:</p>
<ul>
  <li>Maintain your session and shopping cart</li>
  <li>Remember your language and display preferences</li>
  <li>Analyze website traffic and usage patterns</li>
  <li>Improve site performance</li>
</ul>
<p>You can manage or disable cookies through your browser settings. Note that disabling cookies may affect website functionality.</p>
<p><strong>Do Not Track:</strong> Our website does not currently respond to "Do Not Track" browser signals. We do not engage in cross-site tracking.</p>

<h2>6. Data Security</h2>
<p>We implement industry-standard technical and organizational measures to protect your personal data, including:</p>
<ul>
  <li>SSL/TLS encryption for all data in transit</li>
  <li>Encryption of sensitive data at rest</li>
  <li>Secure data storage on AWS infrastructure</li>
  <li>Access controls and authentication for internal systems</li>
</ul>
<p>While we take reasonable steps to protect your data, no method of transmission or storage is 100% secure. We cannot guarantee absolute security.</p>

<h2>7. Your Rights</h2>
<p>Depending on your jurisdiction, you may have the following rights:</p>
<ul>
  <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
  <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data</li>
  <li><strong>Deletion:</strong> Request deletion of your personal data (subject to legal retention requirements)</li>
  <li><strong>Opt-out:</strong> Unsubscribe from marketing emails at any time using the link in any promotional email</li>
  <li><strong>Data portability:</strong> Request your data in a machine-readable format</li>
</ul>
<p>To exercise these rights, contact us at support@xpt-tech.com. We will respond within 30 days.</p>

<h2>8. California Privacy Rights (CCPA/CPRA)</h2>
<p>If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA) and the California Privacy Rights Act (CPRA):</p>
<ul>
  <li><strong>Right to know:</strong> You may request details about the categories and specific pieces of personal information we have collected</li>
  <li><strong>Right to delete:</strong> You may request deletion of your personal information</li>
  <li><strong>Right to opt out of sale:</strong> We do <strong>not sell</strong> your personal information</li>
  <li><strong>Right to non-discrimination:</strong> We will not discriminate against you for exercising your privacy rights</li>
</ul>
<p>To submit a request, email support@xpt-tech.com with the subject line "California Privacy Request".</p>

<h2>9. Children's Privacy</h2>
<p>Our website is not intended for children under the age of <strong>13</strong>. We do not knowingly collect personal information from children under 13. If we become aware that we have inadvertently collected such data, we will promptly delete it. If you believe a child has provided us with personal information, please contact us at support@xpt-tech.com.</p>

<h2>10. International Data Transfers</h2>
<p>Our servers are located in the <strong>United States</strong>. If you access our website from outside the US, your data may be transferred to and processed in the US, where data protection laws may differ from those in your jurisdiction. By using our website, you consent to this transfer.</p>

<h2>11. Data Retention</h2>
<p>We retain your personal data for as long as necessary to fulfill the purposes described in this policy:</p>
<ul>
  <li><strong>Account data:</strong> Retained while your account is active, plus 30 days after deletion request</li>
  <li><strong>Order records:</strong> Retained for 7 years for accounting and tax compliance</li>
  <li><strong>Marketing preferences:</strong> Retained until you opt out</li>
  <li><strong>Website logs:</strong> Retained for up to 12 months</li>
</ul>

<h2>12. Changes to This Policy</h2>
<p>We may update this Privacy Policy from time to time. Material changes will be posted on this page with a revised "Last Updated" date. We encourage you to review this policy periodically.</p>

<h2>13. Contact</h2>
<p>For privacy-related inquiries or to exercise your data rights, please contact us:</p>
<ul>
  <li><strong>Email:</strong> support@xpt-tech.com</li>
  <li><strong>Subject line:</strong> "Privacy Inquiry"</li>
  <li><strong>Website:</strong> <a href="/en/contact">Contact Page</a></li>
</ul>
`.trim(),
  },

  {
    title: "Return Policy",
    slug: "return-policy",
    type: "page",
    sortOrder: 3,
    content: `
<h2>Return Window</h2>
<p>You may return most items within <strong>7 days</strong> of delivery for a full refund. Items must be in their original, unopened packaging and in unused condition.</p>

<h2>Eligibility Requirements</h2>
<p>To be eligible for a return, items must meet <strong>all</strong> of the following conditions:</p>
<ul>
  <li>Returned within 7 days of the delivery date</li>
  <li>In original, unopened, and undamaged packaging</li>
  <li>In unused and resalable condition</li>
  <li>Accompanied by the original invoice or order number</li>
  <li>All included accessories, manuals, and components must be present</li>
</ul>

<h2>Non-Returnable Items</h2>
<p>The following items <strong>cannot</strong> be returned:</p>
<ul>
  <li>Opened or used electronic components (due to ESD sensitivity)</li>
  <li>Custom or special-order items</li>
  <li>Items marked as "Final Sale" or "Non-Returnable" on the product page</li>
  <li>Items damaged due to misuse, improper handling, or customer modification</li>
  <li>Software, downloadable products, or digital content</li>
  <li>Items with removed or altered serial numbers</li>
</ul>

<h2>How to Request a Return</h2>
<ol>
  <li>Log in to your account and go to <strong>My Orders</strong></li>
  <li>Select the order containing the item you wish to return</li>
  <li>Click <strong>"Request Return"</strong> and select the items to return</li>
  <li>Choose a return reason from the dropdown menu</li>
  <li>Provide additional details and upload photos if applicable</li>
  <li>Submit the request and wait for approval (typically within 1-2 business days)</li>
</ol>
<p>You will receive an email notification once your return request is approved or denied.</p>

<h2>Return Shipping</h2>
<ul>
  <li><strong>Defective or incorrect items:</strong> We will provide a prepaid return shipping label at no cost to you</li>
  <li><strong>All other returns:</strong> The customer is responsible for return shipping costs. We recommend using a trackable shipping method</li>
  <li><strong>Refused or undeliverable packages:</strong> Return shipping costs will be deducted from any refund</li>
</ul>

<h2>Restocking Fee</h2>
<p>We do <strong>not</strong> charge a restocking fee for returns that meet our eligibility requirements. However, a <strong>15% restocking fee</strong> may apply to:</p>
<ul>
  <li>Items returned with opened packaging (where the product remains unused)</li>
  <li>Items missing original accessories or documentation</li>
</ul>

<h2>Refund Processing</h2>
<p>Once we receive and inspect your return, we will process your refund within <strong>5-7 business days</strong>.</p>
<ul>
  <li><strong>Credit/debit card payments:</strong> Refunded to your original card. Please allow an additional 5-10 business days for your bank to process the credit</li>
  <li><strong>Other payment methods:</strong> Refunded via the original payment method used at checkout</li>
</ul>
<p>Partial refunds may be issued for items that show signs of use, are missing original packaging, or do not meet the full eligibility requirements.</p>

<h2>Exchanges</h2>
<p>We do not offer direct exchanges. If you need a different item, please return the original item for a refund and place a new order. This ensures the fastest processing time.</p>

<h2>Damaged or Defective Items</h2>
<p>If you receive a damaged or defective item, please contact us within <strong>48 hours</strong> of delivery:</p>
<ol>
  <li>Take clear photos of the damage (including packaging)</li>
  <li>Contact us at support@xpt-tech.com with your order number and photos</li>
  <li>We will arrange a replacement or full refund at no cost to you</li>
</ol>
<p>Do not discard damaged items or packaging until your claim is resolved.</p>

<h2>Late or Missing Refunds</h2>
<p>If you haven't received your refund after the stated processing time:</p>
<ol>
  <li>Check your bank or credit card statement again</li>
  <li>Contact your bank — there is often a processing delay</li>
  <li>If you still have not received your refund, contact us at support@xpt-tech.com</li>
</ol>

<h2>Contact</h2>
<p>For return-related questions, contact us:</p>
<ul>
  <li><strong>Email:</strong> support@xpt-tech.com</li>
  <li><strong>Website:</strong> <a href="/en/contact">Contact Page</a></li>
</ul>
`.trim(),
  },

  // ── FAQ entries ──
  {
    title: "What payment methods do you accept?",
    slug: "faq-payment-methods",
    type: "faq",
    sortOrder: 1,
    content:
      "We accept all major credit cards (Visa, MasterCard, American Express) and debit cards. All payments are securely processed through Stripe.",
  },
  {
    title: "How long does shipping take?",
    slug: "faq-shipping-time",
    type: "faq",
    sortOrder: 2,
    content:
      "Shipping times depend on your location and selected shipping method. Standard shipping typically takes 5-7 business days within the US. Expedited options are available at checkout.",
  },
  {
    title: "Do you ship internationally?",
    slug: "faq-international-shipping",
    type: "faq",
    sortOrder: 3,
    content:
      "Currently we ship within the United States. International shipping will be available soon. For bulk or B2B international orders, please submit a Request for Quote (RFQ).",
  },
  {
    title: "What is your return policy?",
    slug: "faq-return-policy",
    type: "faq",
    sortOrder: 4,
    content:
      'You can return most items within 7 days of delivery in unused, original condition. Visit your account\'s "My Orders" page to start a return. See our full <a href="/en/pages/return-policy">Return Policy</a> for details.',
  },
  {
    title: "How do I track my order?",
    slug: "faq-track-order",
    type: "faq",
    sortOrder: 5,
    content:
      'Once your order ships, you will receive an email with a tracking number. You can also check your order status by logging in and visiting "My Orders" in your account.',
  },
  {
    title: "Do you offer bulk or B2B pricing?",
    slug: "faq-bulk-pricing",
    type: "faq",
    sortOrder: 6,
    content:
      'Yes! Register a Business account and use our Request for Quote (RFQ) feature to get custom pricing on bulk orders. Visit the <a href="/en/rfq">RFQ page</a> to get started.',
  },
  {
    title: "How do I contact support?",
    slug: "faq-contact-support",
    type: "faq",
    sortOrder: 7,
    content:
      'You can reach us through our <a href="/en/contact">contact page</a> or email support@xpt-tech.com. We typically respond within 1 business day.',
  },
  {
    title: "Is my payment information secure?",
    slug: "faq-payment-security",
    type: "faq",
    sortOrder: 8,
    content:
      "Yes. All payments are processed through Stripe, a PCI-DSS Level 1 certified payment processor. We never store your full credit card number on our servers. All data is transmitted over SSL/TLS encryption.",
  },
  {
    title: "Can I cancel my order?",
    slug: "faq-cancel-order",
    type: "faq",
    sortOrder: 9,
    content:
      "You can cancel your order if it has not yet been shipped. Log in to your account, go to My Orders, and click \"Cancel Order\" on the relevant order. If the order has already shipped, you will need to follow our return process instead.",
  },
  {
    title: "Do you offer warranty on products?",
    slug: "faq-warranty",
    type: "faq",
    sortOrder: 10,
    content:
      "Products are covered by the manufacturer's warranty, where applicable. Warranty terms vary by product and manufacturer. Please refer to the product documentation or contact us for specific warranty information.",
  },
];

async function seed() {
  const now = new Date().toISOString();

  for (const page of pages) {
    // Check if page already exists by slug
    const existingId = await findPageBySlug(page.slug);
    const pageId = existingId || ulid();

    const item = {
      pageId,
      title: page.title,
      slug: page.slug,
      content: page.content,
      type: page.type,
      sortOrder: page.sortOrder,
      status: "published",
      createdAt: existingId ? undefined : now, // preserve original createdAt
      updatedAt: now,
    };

    // Remove undefined values
    const cleanItem = Object.fromEntries(
      Object.entries(item).filter(([, v]) => v !== undefined)
    );

    await docClient.send(
      new PutCommand({
        TableName: TABLE,
        Item: cleanItem,
      })
    );

    console.log(`${existingId ? "↻" : "✓"} ${page.type}: ${page.title}`);
  }

  console.log(`\nSeeded ${pages.length} pages.`);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
