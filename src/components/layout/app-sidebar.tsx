"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Ticket,
  ParkingSquare,
  Users,
  MapPin,
  Settings,
  BarChart3,
  Building2,
  ArrowLeftRight,
  LogOut,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ICON_STROKE_WIDTH } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { useCompany } from "@/lib/company-context";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  superAdminOnly?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/tickets", label: "Tickets", icon: Ticket },
      { href: "/lots", label: "Lots & Parking", icon: ParkingSquare },
    ],
  },
  {
    label: "Management",
    items: [
      { href: "/companies", label: "Companies", icon: Building2, superAdminOnly: true },
      { href: "/users", label: "Users", icon: Users },
      { href: "/locations", label: "Locations", icon: MapPin },
    ],
  },
  {
    label: "Analytics",
    items: [
      { href: "/reports", label: "Reports", icon: BarChart3 },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { selectedCompany, setSelectedCompany, isSuper } = useCompany();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleSwitchCompany = () => {
    setSelectedCompany(null);
    router.push("/companies");
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-[var(--z-sticky)] flex w-[var(--sidebar-width)] flex-col pt-5 lg:pt-6">
      <div className="flex items-center px-5 pb-4">
        <Link href="/dashboard">
          <Image
            src="/logo-white.webp"
            alt="SmartLots"
            width={140}
            height={34}
            priority
          />
        </Link>
      </div>

      {selectedCompany && (
        <div className="mx-3 mb-4 rounded-lg bg-white/[0.06] px-3 py-2.5">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                {isSuper ? "Managing" : "Company"}
              </p>
              <p className="text-body-sm font-medium text-sidebar-foreground truncate">
                {selectedCompany.name}
              </p>
            </div>
            {isSuper && (
              <button
                onClick={handleSwitchCompany}
                className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-white/[0.06] hover:text-foreground transition-colors"
                title="Switch company"
              >
                <ArrowLeftRight size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      <ScrollArea className="flex-1 px-3">
        <nav className="flex flex-col gap-6">
          {navGroups.map((group) => {
            const visibleItems = group.items.filter(
              (item) => !item.superAdminOnly || isSuper
            );
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.label}>
                <p className="text-overline text-muted-foreground mb-2 px-2">
                  {group.label}
                </p>
                <div className="flex flex-col gap-0.5">
                  {visibleItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-body-sm transition-colors",
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
                        )}
                      >
                        <item.icon size={18} strokeWidth={ICON_STROKE_WIDTH} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="p-3 pb-5">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start gap-2.5 text-muted-foreground hover:text-foreground"
        >
          <LogOut size={18} strokeWidth={ICON_STROKE_WIDTH} />
          <span className="text-body-sm">Log out</span>
        </Button>
      </div>
    </aside>
  );
}
