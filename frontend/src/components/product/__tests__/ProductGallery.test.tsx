import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductGallery } from "../ProductGallery";

describe("ProductGallery", () => {
  it("renders placeholder when no images", () => {
    const { container } = render(
      <ProductGallery images={[]} productName="Test" />
    );
    // Should show Package icon placeholder
    expect(container.querySelector("svg")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("renders main image", () => {
    render(
      <ProductGallery
        images={["https://cdn.example.com/img1.jpg"]}
        productName="Arduino"
      />
    );
    const img = screen.getByAltText("Arduino");
    expect(img).toHaveAttribute("src", "https://cdn.example.com/img1.jpg");
  });

  it("does not render thumbnails for single image", () => {
    const { container } = render(
      <ProductGallery
        images={["https://cdn.example.com/img1.jpg"]}
        productName="Arduino"
      />
    );
    const buttons = container.querySelectorAll("button");
    expect(buttons.length).toBe(0);
  });

  it("renders thumbnails for multiple images", () => {
    const images = [
      "https://cdn.example.com/img1.jpg",
      "https://cdn.example.com/img2.jpg",
      "https://cdn.example.com/img3.jpg",
    ];
    const { container } = render(
      <ProductGallery images={images} productName="Arduino" />
    );
    const buttons = container.querySelectorAll("button");
    expect(buttons.length).toBe(3);
  });

  it("switches main image on thumbnail click", async () => {
    const user = userEvent.setup();
    const images = [
      "https://cdn.example.com/img1.jpg",
      "https://cdn.example.com/img2.jpg",
    ];
    render(<ProductGallery images={images} productName="Arduino" />);

    // Initially shows first image
    expect(screen.getByAltText("Arduino")).toHaveAttribute(
      "src",
      "https://cdn.example.com/img1.jpg"
    );

    // Click second thumbnail
    const buttons = screen.getAllByRole("button");
    await user.click(buttons[1]);

    // Main image should change
    expect(screen.getByAltText("Arduino")).toHaveAttribute(
      "src",
      "https://cdn.example.com/img2.jpg"
    );
  });

  it("highlights selected thumbnail", () => {
    const images = [
      "https://cdn.example.com/img1.jpg",
      "https://cdn.example.com/img2.jpg",
    ];
    const { container } = render(
      <ProductGallery images={images} productName="Arduino" />
    );
    const buttons = container.querySelectorAll("button");
    expect(buttons[0].className).toContain("border-ws-blue");
    expect(buttons[1].className).not.toContain("border-ws-blue");
  });
});
