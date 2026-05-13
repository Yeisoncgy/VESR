"use client";

import { useEffect, useState } from "react";

export function CopyLinkButton() {
  const [href, setHref] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setHref(window.location.href);
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback: select-all on a temp textarea
      const ta = document.createElement("textarea");
      ta.value = href;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }

  return (
    <button
      onClick={copy}
      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--cyan)] transition-colors px-4 py-3 flex items-center justify-between text-left group"
    >
      <span className="font-mono text-xs sm:text-sm text-[var(--muted)] truncate pr-3 group-hover:text-[var(--foreground)] transition-colors">
        {href || "…"}
      </span>
      <span
        className={`flex-shrink-0 text-[10px] uppercase tracking-wider font-semibold ${
          copied ? "text-[var(--cyan)]" : "text-[var(--muted)]"
        }`}
      >
        {copied ? "¡Copiado!" : "Copiar"}
      </span>
    </button>
  );
}
