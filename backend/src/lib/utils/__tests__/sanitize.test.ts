import { describe, it, expect } from "vitest";
import { sanitizeRichText, stripHtml } from "../sanitize";

describe("sanitizeRichText", () => {
  it("allows safe formatting tags", () => {
    const input = "<p><strong>Bold</strong> and <em>italic</em></p>";
    expect(sanitizeRichText(input)).toBe(input);
  });

  it("allows headings", () => {
    const input = "<h1>Title</h1><h2>Subtitle</h2>";
    expect(sanitizeRichText(input)).toBe(input);
  });

  it("allows lists", () => {
    const input = "<ul><li>Item 1</li><li>Item 2</li></ul>";
    expect(sanitizeRichText(input)).toBe(input);
  });

  it("allows tables", () => {
    const input = "<table><tr><td>Cell</td></tr></table>";
    expect(sanitizeRichText(input)).toBe(input);
  });

  it("strips script tags", () => {
    const input = '<p>Text</p><script>alert("xss")</script>';
    expect(sanitizeRichText(input)).not.toContain("<script>");
    expect(sanitizeRichText(input)).not.toContain("alert");
  });

  it("strips event handlers", () => {
    const input = '<p onmouseover="alert(1)">Text</p>';
    expect(sanitizeRichText(input)).not.toContain("onmouseover");
  });

  it("strips iframe tags", () => {
    const input = '<iframe src="https://evil.com"></iframe>';
    expect(sanitizeRichText(input)).not.toContain("<iframe>");
  });

  it("adds rel=noopener to links", () => {
    const input = '<a href="https://example.com">Link</a>';
    const result = sanitizeRichText(input);
    expect(result).toContain('rel="noopener noreferrer"');
    expect(result).toContain('target="_blank"');
  });

  it("strips javascript: URLs", () => {
    const input = '<a href="javascript:alert(1)">Click</a>';
    const result = sanitizeRichText(input);
    expect(result).not.toContain("javascript:");
  });

  it("allows img with src and alt", () => {
    const input = '<img src="https://example.com/img.jpg" alt="Photo">';
    const result = sanitizeRichText(input);
    expect(result).toContain("src=");
    expect(result).toContain("alt=");
  });

  it("strips style attributes except on span", () => {
    const input = '<div style="color:red">Styled</div>';
    const result = sanitizeRichText(input);
    expect(result).not.toContain("style=");
  });
});

describe("stripHtml", () => {
  it("removes all HTML tags", () => {
    expect(stripHtml("<p>Hello <strong>World</strong></p>")).toBe(
      "Hello World"
    );
  });

  it("handles empty string", () => {
    expect(stripHtml("")).toBe("");
  });

  it("handles plain text", () => {
    expect(stripHtml("No tags here")).toBe("No tags here");
  });

  it("strips nested tags", () => {
    expect(
      stripHtml("<div><p><span>Deep</span></p></div>")
    ).toBe("Deep");
  });

  it("trims whitespace", () => {
    expect(stripHtml("  <p>Text</p>  ")).toBe("Text");
  });
});
