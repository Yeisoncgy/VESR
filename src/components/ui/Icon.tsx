import type { JSX } from "react";

export const Icon = {
  copy: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="5" width="9" height="9" rx="1.5" />
      <path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" />
    </svg>
  ),
  link: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M7 9.5a2.5 2.5 0 0 0 3.5 0l2.5-2.5a2.5 2.5 0 0 0-3.5-3.5l-1 1" />
      <path d="M9 6.5a2.5 2.5 0 0 0-3.5 0l-2.5 2.5a2.5 2.5 0 0 0 3.5 3.5l1-1" />
    </svg>
  ),
  check: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8.5l3 3 7-7" />
    </svg>
  ),
  play: (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="currentColor">
      <path d="M7 4.5v13a0.5 0.5 0 0 0 0.78 0.41l10-6.5a0.5 0.5 0 0 0 0-0.84l-10-6.5A0.5 0.5 0 0 0 7 4.5z" />
    </svg>
  ),
  pause: (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="currentColor">
      <rect x="6" y="4" width="4" height="14" rx="1" />
      <rect x="12" y="4" width="4" height="14" rx="1" />
    </svg>
  ),
  arrow: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  ),
  warn: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="8" r="6" />
      <path d="M8 5v3.5M8 11v.5" />
    </svg>
  ),
  rewind: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11 12L20 19V5L11 12ZM3 12L12 19V5L3 12Z" />
    </svg>
  ),
  forward: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 12L4 5V19L13 12ZM21 12L12 5V19L21 12Z" />
    </svg>
  ),
} satisfies Record<string, JSX.Element>;
