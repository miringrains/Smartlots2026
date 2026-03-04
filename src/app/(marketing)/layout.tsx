import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SmartLots Pro — Vehicle Management for Modern Dealerships",
  description:
    "Track, photograph, and manage every vehicle across your dealership lots in real time. Multi-location parking management built for automotive teams.",
  openGraph: {
    title: "SmartLots Pro — Vehicle Management for Modern Dealerships",
    description:
      "Track, photograph, and manage every vehicle across your dealership lots in real time.",
    type: "website",
    url: "https://smartlotpro.com",
  },
};

function MarketingNav() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo-white.webp"
            alt="SmartLots Pro"
            width={140}
            height={36}
            priority
          />
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="#features"
            className="hidden sm:block text-body-sm text-white/60 hover:text-white transition-colors"
          >
            Features
          </Link>
          <Link
            href="#how-it-works"
            className="hidden sm:block text-body-sm text-white/60 hover:text-white transition-colors"
          >
            How It Works
          </Link>
          <Link
            href="https://admin.smartlotpro.com/login"
            className="text-body-sm text-white/60 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="#contact"
            className="rounded-lg bg-brand-500 px-4 py-2 text-body-sm font-medium text-white hover:bg-brand-600 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>
    </header>
  );
}

function MarketingFooter() {
  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Image
              src="/logo-white.webp"
              alt="SmartLots Pro"
              width={120}
              height={30}
            />
            <p className="mt-4 text-body-sm text-white/40 max-w-xs">
              Real-time vehicle management for automotive dealerships of every
              size.
            </p>
          </div>
          <div>
            <h4 className="text-caption text-white/60 mb-3">Product</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="#features"
                  className="text-body-sm text-white/40 hover:text-white transition-colors"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="#how-it-works"
                  className="text-body-sm text-white/40 hover:text-white transition-colors"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  href="#contact"
                  className="text-body-sm text-white/40 hover:text-white transition-colors"
                >
                  Request Demo
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-caption text-white/60 mb-3">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/privacy"
                  className="text-body-sm text-white/40 hover:text-white transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-body-sm text-white/40 hover:text-white transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/support"
                  className="text-body-sm text-white/40 hover:text-white transition-colors"
                >
                  Support
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-caption text-white/60 mb-3">Connect</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="mailto:info@smartlotpro.com"
                  className="text-body-sm text-white/40 hover:text-white transition-colors"
                >
                  info@smartlotpro.com
                </a>
              </li>
              <li>
                <Link
                  href="https://admin.smartlotpro.com/login"
                  className="text-body-sm text-white/40 hover:text-white transition-colors"
                >
                  Admin Portal
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-caption text-white/30">
            &copy; {new Date().getFullYear()} SmartLots Pro. All rights
            reserved.
          </p>
          <p className="text-caption text-white/30">
            Available on the App Store
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <MarketingNav />
      {children}
      <MarketingFooter />
    </div>
  );
}
