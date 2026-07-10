import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistPixelSquare } from "geist/font/pixel";
import { TooltipProvider } from "@/components/ui/tooltip"
import { ThemeProvider } from "@/components/theme-provider"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css";

export const geistSans = GeistSans;
export const geistPixel = GeistPixelSquare;

export const metadata: Metadata = {
  title: "Type Testing - Compile-time Type Testing for TypeScript",
  description: "A micro library for compile-time type testing in TypeScript. Test your types with confidence and precision.",
  keywords: ["TypeScript", "type testing", "compile-time", "testing", "types", "library"],
  authors: [{ name: "deessejs" }],
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "Type Testing - Compile-time Type Testing for TypeScript",
    description: "A micro library for compile-time type testing in TypeScript. Test your types with confidence and precision.",
    url: "https://github.com/deessejs/type-testing",
    siteName: "Type Testing",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Type Testing - Compile-time Type Testing for TypeScript",
    description: "A micro library for compile-time type testing in TypeScript. Test your types with confidence and precision.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistPixel.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
