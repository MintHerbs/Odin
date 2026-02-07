import { Roboto, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Configure Roboto
const roboto = Roboto({
  weight: ["500", "600"],
  subsets: ["latin"],
  variable: "--font-roboto", // This creates a CSS variable we can use in styles
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Turing Test",
  description: "We are conducting a Turing Test on an AI trained to generate poetic prose in the form of Sega lyrics, specifically in the low-resource language of Mauritian Kreol. Participate now by clicking the link!",
  openGraph: {
    title: "Turing Test",
    description: "We are conducting a Turing Test on an AI trained to generate poetic prose in the form of Sega lyrics, specifically in the low-resource language of Mauritian Kreol. Participate now by clicking the link!",
    images: [
      {
        url: "/img/banner.jpg",
        width: 1200,
        height: 630,
        alt: "Turing Test - AI Sega Lyrics Survey",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Turing Test",
    description: "We are conducting a Turing Test on an AI trained to generate poetic prose in the form of Sega lyrics, specifically in the low-resource language of Mauritian Kreol. Participate now by clicking the link!",
    images: ["/img/banner.jpg"],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${roboto.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}