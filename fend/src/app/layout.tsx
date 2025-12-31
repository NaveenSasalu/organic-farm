import type { Metadata } from "next";
import "./globals.css";
import CartDrawer from "@/components/CartDrawer";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Organic Oasis Farm",
  description: "Fresh from Yelachaguppe Farm",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* Everything (Public pages AND Admin pages) renders here */}
        {children}

        <CartDrawer />

        <footer className="bg-stone-100 border-t border-stone-200 py-10">
          <div className="max-w-6xl mx-auto px-6 flex justify-between items-center text-stone-400 text-sm">
            <p>© 2025 Organic Oasis Farm</p>
            <Link href="/login" className="hover:text-green-700">
              Admin Login
            </Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
