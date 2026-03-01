import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SmartLots Pro – Legal",
};

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-12">{children}</div>
    </div>
  );
}
