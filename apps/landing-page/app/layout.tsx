import type { Metadata } from "next";
import "./globals.css";
import { PageTransition } from "@/components/PageTransition";

export const metadata: Metadata = {
  title: "gopal",
  description:
    "angel loads normally, then gets corrupted into gopal: a realtime goblin voice and vision companion.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-paper text-ink-near antialiased">
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}
