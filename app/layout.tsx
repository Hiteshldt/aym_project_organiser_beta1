import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ConfirmProvider } from "@/components/ui/confirm";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ayuvam.com"),
  title: {
    default: "Ayuvam — Make the work look as good as it is.",
    template: "%s · Ayuvam",
  },
  description:
    "A clean, organized space to share client work — proposals, decks, files, and links. Every client gets their own workspace. Without the Drive folder chaos.",
  keywords: [
    "client portal",
    "agency client portal",
    "freelance client portal",
    "file sharing for agencies",
    "client deliverables",
    "design studio tools",
  ],
  openGraph: {
    title: "Ayuvam — Make the work look as good as it is.",
    description:
      "A clean, organized space to share client work — proposals, decks, files, and links.",
    url: "/",
    siteName: "Ayuvam",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ayuvam — Make the work look as good as it is.",
    description:
      "A clean, organized space to share client work — proposals, decks, files, and links.",
  },
  icons: {
    icon: "/favicon.ico",
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
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full`}
    >
      <head>
        {/* Apply a saved dark theme before paint, scoped to the app + share
            view (marketing stays light). Mirrors components/theme.tsx. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('ayuvam-theme');var p=location.pathname;if(t==='dark'&&(p.indexOf('/workspace')===0||p.indexOf('/share')===0||p.indexOf('/settings')===0||p.indexOf('/admin')===0)){document.documentElement.classList.add('dark');}}catch(e){}})();",
          }}
        />
      </head>
      <body className="min-h-full bg-paper text-ink antialiased">
        <ConfirmProvider>{children}</ConfirmProvider>
        <Toaster />
      </body>
    </html>
  );
}
