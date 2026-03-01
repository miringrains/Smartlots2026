"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { pageTransition, staggerItem } from "@/lib/motion";
import { createClient } from "@/lib/supabase/client";
import type { OccupancyDTO } from "@/lib/dto";

const COLORS = ["#ee3f43", "#3b82f6", "#22c55e", "#eab308", "#a855f7"];

export default function ReportsPage() {
  const [lotStats, setLotStats] = useState<OccupancyDTO[]>([]);
  const [ticketsByState, setTicketsByState] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const headers = { Authorization: `Bearer ${session.access_token}` };

      const [statsRes, ticketsRes] = await Promise.all([
        fetch("/api/lots/statistics", { headers }),
        fetch("/api/tickets", { headers }),
      ]);

      const statsData = await statsRes.json();
      setLotStats(statsData.data || []);

      const ticketsData = await ticketsRes.json();
      const tickets = ticketsData.data || [];

      const stateCounts: Record<string, number> = {};
      tickets.forEach((t: { ticketState: string }) => {
        stateCounts[t.ticketState] = (stateCounts[t.ticketState] || 0) + 1;
      });

      setTicketsByState(
        Object.entries(stateCounts).map(([name, value]) => ({ name, value }))
      );
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 bg-muted rounded animate-pulse" />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-80 bg-muted rounded-xl animate-pulse" />
          <div className="h-80 bg-muted rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={pageTransition} initial="hidden" animate="visible">
      <PageHeader
        title="Reports"
        description="Analytics and insights for your operations"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 size={16} strokeWidth={1.75} />
                Lot Occupancy
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lotStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={lotStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                    <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="occupiedSpots" fill="#ee3f43" radius={[4, 4, 0, 0]} name="Occupied" />
                    <Bar dataKey="availableSpots" fill="#22c55e" radius={[4, 4, 0, 0]} name="Available" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-body-sm text-muted-foreground text-center py-16">
                  No lot data available
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader>
              <CardTitle>Tickets by Status</CardTitle>
            </CardHeader>
            <CardContent>
              {ticketsByState.length > 0 ? (
                <div className="flex flex-col items-center">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={ticketsByState}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {ticketsByState.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-4 mt-2">
                    {ticketsByState.map((entry, index) => (
                      <div key={entry.name} className="flex items-center gap-1.5 text-caption">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        {entry.name} ({entry.value})
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-body-sm text-muted-foreground text-center py-16">
                  No ticket data available
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
