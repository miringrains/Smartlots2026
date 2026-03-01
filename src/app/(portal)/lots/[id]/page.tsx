"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Car } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { pageTransition, staggerItem } from "@/lib/motion";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { LotDTO, TicketDTO } from "@/lib/dto";

export default function LotDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [lot, setLot] = useState<LotDTO | null>(null);
  const [vehicles, setVehicles] = useState<TicketDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const headers = { Authorization: `Bearer ${session.access_token}` };

      const [lotsRes, vehiclesRes] = await Promise.all([
        fetch("/api/lots", { headers }),
        fetch(`/api/lots/${id}/vehicles`, { headers }),
      ]);

      const lotsData = await lotsRes.json();
      const vehiclesData = await vehiclesRes.json();

      const currentLot = (lotsData.data || []).find((l: LotDTO) => l.id === id);
      setLot(currentLot || null);
      setVehicles(vehiclesData.data?.vehicles || []);
      setLoading(false);
    }
    fetchData();
  }, [id]);

  if (loading) {
    return <div className="h-64 bg-muted rounded-xl animate-pulse" />;
  }

  if (!lot) {
    return <div className="text-center py-12 text-muted-foreground">Lot not found</div>;
  }

  const spotStateColors: Record<string, string> = {
    AVAILABLE: "bg-success/10 border-success/30 text-success",
    OCCUPIED: "bg-warning/10 border-warning/30 text-warning-foreground",
    RESERVED: "bg-secondary border-border",
    BLOCKED: "bg-destructive/10 border-destructive/30 text-destructive",
  };

  return (
    <motion.div variants={pageTransition} initial="hidden" animate="visible">
      <PageHeader title={lot.name} description={`${lot.spots.length} spots configured`}>
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft size={14} />
          Back
        </Button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader>
              <CardTitle>Spot Grid</CardTitle>
            </CardHeader>
            <CardContent>
              {lot.spots.length > 0 ? (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                  {lot.spots.map((spot) => (
                    <div
                      key={spot.id}
                      className={cn(
                        "flex items-center justify-center rounded-md border p-2 text-caption font-medium",
                        spotStateColors[spot.spotState] || "bg-muted border-border"
                      )}
                    >
                      {spot.label}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-body-sm text-muted-foreground text-center py-8">No spots configured</p>
              )}
              <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t">
                <div className="flex items-center gap-1.5 text-caption">
                  <div className="w-3 h-3 rounded-sm bg-success/10 border border-success/30" />
                  Available
                </div>
                <div className="flex items-center gap-1.5 text-caption">
                  <div className="w-3 h-3 rounded-sm bg-warning/10 border border-warning/30" />
                  Occupied
                </div>
                <div className="flex items-center gap-1.5 text-caption">
                  <div className="w-3 h-3 rounded-sm bg-destructive/10 border border-destructive/30" />
                  Blocked
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car size={16} strokeWidth={1.75} />
                Vehicles in Lot ({vehicles.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {vehicles.length > 0 ? (
                <div className="space-y-3">
                  {vehicles.map((v) => (
                    <div key={v.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
                      <div>
                        <p className="text-body-sm font-medium">{v.year} {v.make} {v.model}</p>
                        <p className="text-caption text-muted-foreground">{v.licensePlate}</p>
                      </div>
                      <StatusBadge status={v.ticketState} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-body-sm text-muted-foreground text-center py-8">No vehicles currently in this lot</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
