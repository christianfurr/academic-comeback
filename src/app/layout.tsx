import type { Metadata } from "next";
import { Instrument_Serif, Inter_Tight, JetBrains_Mono, Bricolage_Grotesque } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});

const interTight = Inter_Tight({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-sport",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Comeback / Protocol — Academic Recovery Planner",
    template: "%s · Comeback / Protocol",
  },
  description:
    "Paste your grades, set the grade you're chasing, and see exactly what you need to score on every assignment left. Plan your academic comeback.",
  applicationName: "Comeback / Protocol",
  authors: [{ name: "Christian Furr" }],
  creator: "Christian Furr",
  keywords: [
    "grade calculator",
    "GPA planner",
    "academic recovery",
    "grade tracker",
    "what do I need on my final",
  ],
  openGraph: {
    title: "Comeback / Protocol — Academic Recovery Planner",
    description:
      "Plan your academic comeback. See exactly what you need on every assignment left to hit the grade you're chasing.",
    siteName: "Comeback / Protocol",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Comeback / Protocol",
    description: "Plan your academic comeback.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-bg="midnight"
      data-accent="electric"
      data-density="comfortable"
      data-type="editorial"
      className={`${instrumentSerif.variable} ${interTight.variable} ${jetBrainsMono.variable} ${bricolage.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ClerkProvider>
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
