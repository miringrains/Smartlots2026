"use client";

import { useRouter } from "next/navigation";
import { LogOut, Settings, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { ICON_STROKE_WIDTH } from "@/lib/constants";

export function UserMenu() {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="rounded-full">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-xs bg-primary text-primary-foreground">
              A
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-body-sm">My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/settings")}>
          <Settings size={14} strokeWidth={ICON_STROKE_WIDTH} />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/settings")}>
          <User size={14} strokeWidth={ICON_STROKE_WIDTH} />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
          <LogOut size={14} strokeWidth={ICON_STROKE_WIDTH} />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
