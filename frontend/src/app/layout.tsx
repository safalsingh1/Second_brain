import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Second Brain | AI Cofounder for Builders",
  description: "An AI agent that watches your project folder and acts as your intelligent technical cofounder. Ask questions, get TODOs, detect inconsistencies.",
  keywords: ["AI", "second brain", "project memory", "cofounder", "RAG", "developer tools"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
