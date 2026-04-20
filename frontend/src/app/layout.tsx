import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

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
    <html lang="en">
      <body
        className={`${inter.variable} font-sans bg-[#080810] text-slate-100 min-h-screen antialiased`}
      >
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#0d0d1a",
                color: "#f0f9ff",
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

