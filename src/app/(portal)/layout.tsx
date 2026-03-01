import { AuroraBackdrop } from "@/components/aurora/aurora-backdrop";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { CompanyProvider } from "@/lib/company-context";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CompanyProvider>
      <div className="h-screen bg-background overflow-hidden">
        <AuroraBackdrop subtle />

        <div className="hidden lg:block">
          <AppSidebar />
        </div>

        <div className="relative z-[1] flex flex-col lg:pl-[var(--sidebar-width)] h-screen p-2 lg:p-3">
          <div className="light-panel flex-1 min-h-0 rounded-2xl bg-background shadow-xl overflow-hidden">
            <div className="h-full overflow-y-auto overflow-x-hidden">
              <TopBar />
              <main className="mx-auto max-w-[var(--content-max-width)] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
                {children}
              </main>
            </div>
          </div>
        </div>
      </div>
    </CompanyProvider>
  );
}
