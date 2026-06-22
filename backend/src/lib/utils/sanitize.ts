import sanitizeHtml from "sanitize-html";

/**
 * Sanitize rich text HTML content (product descriptions, page content).
 * Allows safe formatting tags but strips scripts, event handlers, etc.
 */
export function sanitizeRichText(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "h1", "h2", "h3", "h4", "h5", "h6",
      "p", "br", "hr",
      "strong", "b", "em", "i", "u", "s",
      "ul", "ol", "li",
      "a", "img",
      "table", "thead", "tbody", "tr", "th", "td",
      "blockquote", "pre", "code",
      "span", "div",
    ],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "width", "height"],
      td: ["colspan", "rowspan"],
      th: ["colspan", "rowspan"],
      span: ["style"],
    },
    allowedStyles: {
      span: {
        color: [/^#[0-9a-fA-F]{3,6}$/],
        "text-align": [/^(left|right|center|justify)$/],
      },
    },
    // Force all links to open in new tab with noopener
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
    },
  });
}

/**
 * Strip all HTML tags — for plain text fields like names, titles, etc.
 */
export function stripHtml(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();
}
