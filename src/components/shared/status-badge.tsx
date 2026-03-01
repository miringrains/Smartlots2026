import { Badge } from "@/components/ui/badge";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" }> = {
  DOCUMENTED: { label: "Documented", variant: "secondary" },
  SERVICING: { label: "Servicing", variant: "warning" },
  READY: { label: "Ready", variant: "success" },
  DELIVERED: { label: "Delivered", variant: "default" },
  AVAILABLE: { label: "Available", variant: "success" },
  OCCUPIED: { label: "Occupied", variant: "warning" },
  RESERVED: { label: "Reserved", variant: "secondary" },
  BLOCKED: { label: "Blocked", variant: "destructive" },
  USER: { label: "Attendant", variant: "secondary" },
  ADMIN: { label: "Admin", variant: "default" },
  SUPER_ADMIN: { label: "Super Admin", variant: "destructive" },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || { label: status, variant: "outline" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
