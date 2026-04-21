import type { Metadata } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const themeInitScript = `
  try {
    const stored = localStorage.getItem("theme");
    const theme = stored === "light" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", theme === "dark");
  } catch {
    document.documentElement.classList.add("dark");
  }
`;

export const metadata: Metadata = {
  title: "Davinci AI Screener",
  description: "AI-powered talent screening with bias detection and interview generation",
  icons: {
    icon: [
      {
        url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎯</text></svg>",
        type: "image/svg+xml",
      },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans bg-slate-50 dark:bg-[#080810] text-slate-900 dark:text-slate-100 min-h-screen antialiased`}
      >
        <Script id="theme-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              className: "!text-sm",
              style: {
                background: "var(--toast-bg, #0d0d1a)",
                color: "var(--toast-fg, #f0f9ff)",
                border: "1px solid rgba(34,211,238,0.12)",
                borderRadius: "10px",
                fontSize: "13px",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}

