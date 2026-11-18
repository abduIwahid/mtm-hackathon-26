import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MTM Project — TBD (set on the day)",
  description: "Built at MTM Hackathon '26 by Team AXIONS.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-border bg-surface">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
            <span className="font-bold tracking-tight">AXIONS</span>
            <span className="text-sm text-muted">MTM Hackathon &rsquo;26</span>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <footer className="border-t border-border py-6 text-center text-sm text-muted">
          Team AXIONS · COMSATS · Built in 3.5 hours
        </footer>
      </body>
    </html>
  );
}
