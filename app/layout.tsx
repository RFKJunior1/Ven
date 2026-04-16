import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vendetta — OOH Creative Intelligence",
  description: "100 minds. One truth. AI-powered creative testing for out-of-home advertising.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ background: "#0A0A0B", color: "#E8E8F0" }}>
        {children}
      </body>
    </html>
  );
}
