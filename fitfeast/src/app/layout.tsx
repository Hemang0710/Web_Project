import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import NextAuthSessionProvider from "./SessionProvider";
import { AuthProvider } from "./context/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FitFeast - Health & Nutrition",
  description: "Your personal health and nutrition companion",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NextAuthSessionProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </NextAuthSessionProvider>
      </body>
    </html>
  );
}
