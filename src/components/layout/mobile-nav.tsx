"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
      { href: "/locations", label: "Locations & Parking", icon: ParkingSquare },
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

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { selectedCompany, setSelectedCompany, isSuper } = useCompany();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

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
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 -ml-1 lg:hidden"
        >
          <Menu size={20} strokeWidth={ICON_STROKE_WIDTH} />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        showCloseButton={false}
        className="w-[280px] p-0 border-r-0 bg-[#080808] flex flex-col"
      >
        <div className="px-5 pt-6 pb-2 space-y-3">
          <Image
            src="/logo-white.webp"
            alt="SmartLots"
            width={120}
            height={30}
          />
        </div>

        {selectedCompany && (
          <div className="mx-3 mt-2 mb-1 rounded-lg bg-white/[0.06] px-3 py-2.5">
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
                >
                  <ArrowLeftRight size={14} />
                </button>
              )}
            </div>
          </div>
        )}

        <div className="mx-5 border-t border-white/[0.06]" />
        <ScrollArea className="flex-1 py-3 px-3">
          <nav className="flex flex-col gap-5">
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
                            "flex items-center gap-2.5 rounded-md px-2.5 py-2.5 text-body-sm transition-colors",
                            isActive
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "text-sidebar-foreground hover:bg-white/[0.04] hover:text-foreground"
                          )}
                        >
                          <item.icon
                            size={18}
                            strokeWidth={ICON_STROKE_WIDTH}
                          />
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
        <div className="border-t border-white/[0.06] p-3">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start gap-2.5 text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
          >
            <LogOut size={18} strokeWidth={ICON_STROKE_WIDTH} />
            <span className="text-body-sm">Log out</span>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
