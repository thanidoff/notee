import type { Metadata } from "next";
import { Nunito, Prompt } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

const prompt = Prompt({
  variable: "--font-mitr", // keep the CSS variable name the same so globals.css doesn't break
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
});

import { PasteListener } from "@/components/PasteListener";
import { QuickSaveModal } from "@/components/QuickSaveModal";

export const metadata: Metadata = {
  title: "Use-It-Later",
  description: "Situation-based Personal Knowledge Vault",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`${nunito.variable} ${prompt.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-[var(--color-bg-main)] text-slate-800">
        {children}
        <PasteListener />
        <QuickSaveModal />
      </body>
    </html>
  );
}
