import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EZE — Be Your Own Favorite Artist",
  description: "Describe the music you imagine and hear it come to life in minutes.",
};

// Runs before paint to set the theme class, preventing a light/dark flash.
const themeInitScript = `(function(){try{var t=localStorage.getItem('theme');var sys=window.matchMedia('(prefers-color-scheme: dark)').matches;var dark=t==='dark'||((t==='system'||!t)&&sys);var e=document.documentElement;e.classList.toggle('dark',dark);e.style.colorScheme=dark?'dark':'light';}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
