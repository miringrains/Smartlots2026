"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Car, ParkingSquare, Ticket, AlertTriangle, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/shared/page-header";
import { staggerContainer, staggerItem, pageTransition } from "@/lib/motion";
import { createClient } from "@/lib/supabase/client";

interface Stats {
  totalTickets: number;
  activeTickets: number;
  totalLots: number;
  blockedVehicles: number;
  lotStats: Array<{
    id: string;
    name: string;
    totalSpots: number;
    occupiedSpots: number;
    occupancyRate: number;
  }>;
  recentTickets: Array<{
    id: string;
    vin: string;
    make: string;
    model: string;
    ticketState: string;
    createdAt: string;
  }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const headers = { Authorization: `Bearer ${session.access_token}` };

      const [ticketsRes, lotsRes, statsRes] = await Promise.all([
        fetch("/api/tickets", { headers }),
        fetch("/api/lots", { headers }),
        fetch("/api/lots/statistics", { headers }),
      ]);

      const tickets = await ticketsRes.json();
      const lots = await lotsRes.json();
      const lotStats = await statsRes.json();

      const ticketList = tickets.data || [];
      const activeTickets = ticketList.filter(
        (t: { ticketState: string }) => t.ticketState !== "DELIVERED"
      );
      const blockedCount = ticketList.filter(
        (t: { parking?: { isBlocked: boolean } }) => t.parking?.isBlocked
      ).length;

      setStats({
        totalTickets: ticketList.length,
        activeTickets: activeTickets.length,
        totalLots: (lots.data || []).length,
        blockedVehicles: blockedCount,
        lotStats: lotStats.data || [],
        recentTickets: ticketList.slice(0, 8).map((t: Record<string, unknown>) => ({
          id: t.id,
          vin: t.vin,
          make: t.make,
          model: t.model,
          ticketState: t.ticketState,
          createdAt: t.createdAt,
        })),
      });
      setLoading(false);
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const kpis = [
    {
      label: "Total Tickets",
      value: stats?.totalTickets || 0,
      icon: Ticket,
      color: "text-brand-500",
    },
    {
      label: "Active Vehicles",
      value: stats?.activeTickets || 0,
      icon: Car,
      color: "text-success",
    },
    {
      label: "Parking Lots",
      value: stats?.totalLots || 0,
      icon: ParkingSquare,
      color: "text-chart-2",
    },
    {
      label: "Blocked Vehicles",
      value: stats?.blockedVehicles || 0,
      icon: AlertTriangle,
      color: "text-warning",
    },
  ];

  return (
    <motion.div variants={pageTransition} initial="hidden" animate="visible">
      <PageHeader
        title="Dashboard"
        description="Overview of your parking operations"
      />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8"
      >
        {kpis.map((kpi) => (
          <motion.div key={kpi.label} variants={staggerItem}>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-caption text-muted-foreground">
                      {kpi.label}
                    </p>
                    <p className="text-display-sm mt-1">{kpi.value}</p>
                  </div>
                  <div className={`rounded-xl bg-muted p-2.5 ${kpi.color}`}>
                    <kpi.icon size={20} strokeWidth={1.75} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp size={16} strokeWidth={1.75} />
                Lot Occupancy
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.lotStats && stats.lotStats.length > 0 ? (
                <div className="space-y-4">
                  {stats.lotStats.map((lot) => (
                    <div key={lot.id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-body-sm font-medium">
                          {lot.name}
                        </span>
                        <span className="text-caption text-muted-foreground">
                          {lot.occupiedSpots}/{lot.totalSpots} spots
                        </span>
                      </div>
                      <Progress value={lot.occupancyRate} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-body-sm text-muted-foreground py-8 text-center">
                  No lots configured yet
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket size={16} strokeWidth={1.75} />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.recentTickets && stats.recentTickets.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="flex items-center justify-between py-1"
                    >
                      <div>
                        <p className="text-body-sm font-medium">
                          {ticket.make} {ticket.model}
                        </p>
                        <p className="text-caption text-muted-foreground">
                          VIN: {ticket.vin?.slice(-6)}
                        </p>
                      </div>
                      <Badge
                        variant={
                          ticket.ticketState === "DELIVERED"
                            ? "success"
                            : ticket.ticketState === "READY"
                            ? "success"
                            : ticket.ticketState === "SERVICING"
                            ? "warning"
                            : "secondary"
                        }
                      >
                        {ticket.ticketState}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-body-sm text-muted-foreground py-8 text-center">
                  No recent activity
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
