import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EZE — Be Your Own Favorite Artist",
  description: "Describe the music you imagine and hear it come to life in minutes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
