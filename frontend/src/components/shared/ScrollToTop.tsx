"use client";

import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 300);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-20 right-6 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-ws-blue bg-white shadow-md hover:bg-ws-surface transition-colors"
      aria-label="Scroll to top"
    >
      <ArrowUp className="h-4 w-4 text-ws-blue" />
    </button>
  );
}
