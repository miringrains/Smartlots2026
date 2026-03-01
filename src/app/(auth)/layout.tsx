import Image from "next/image";
import { AuroraBackdrop } from "@/components/aurora/aurora-backdrop";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4">
      <AuroraBackdrop />

      <div className="relative z-10 w-full max-w-[420px]">
        <div className="light-panel rounded-2xl bg-background p-8 shadow-lg">
          <div className="mb-8 flex justify-center">
            <Image
              src="/logo.webp"
              alt="SmartLots"
              width={160}
              height={40}
              priority
            />
          </div>
          {children}
        </div>
      </div>

      <p className="relative z-10 mt-8 text-caption text-white/40">
        &copy; {new Date().getFullYear()} SmartLots Pro. All rights reserved.
      </p>
    </div>
  );
}
