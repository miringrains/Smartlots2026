"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { ArrowLeft, MapPin, Clock, Camera, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { pageTransition, staggerItem } from "@/lib/motion";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import type { TicketDTO, MovementDTO } from "@/lib/dto";

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [ticket, setTicket] = useState<TicketDTO | null>(null);
  const [movements, setMovements] = useState<MovementDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch_data() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const headers = { Authorization: `Bearer ${session.access_token}` };

      const [ticketRes, movementsRes] = await Promise.all([
        fetch(`/api/v2/tickets/${id}`, { headers }),
        fetch(`/api/v2/tickets/${id}/movements`, { headers }),
      ]);

      const ticketData = await ticketRes.json();
      const movementsData = await movementsRes.json();

      setTicket(ticketData.data || null);
      setMovements(movementsData.data || []);
      setLoading(false);
    }

    fetch_data();
  }, [id]);

  const updateStatus = async (newState: string) => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await fetch(`/api/v2/tickets/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ticketState: newState }),
    });

    setTicket((prev) => prev ? { ...prev, ticketState: newState } : null);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 bg-muted rounded animate-pulse" />
        <div className="h-64 bg-muted rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!ticket) {
    return <div className="text-center py-12 text-muted-foreground">Ticket not found</div>;
  }

  return (
    <motion.div variants={pageTransition} initial="hidden" animate="visible">
      <PageHeader
        title={`${ticket.year} ${ticket.make} ${ticket.model}`}
        description={`VIN: ${ticket.vin} | Plate: ${ticket.licensePlate}`}
      >
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft size={14} />
          Back
        </Button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div variants={staggerItem} className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Ticket Details</CardTitle>
                <StatusBadge status={ticket.ticketState} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-caption text-muted-foreground">Ticket #</p>
                  <p className="text-body-sm font-medium">{ticket.ticketNumber || "N/A"}</p>
                </div>
                <div>
                  <p className="text-caption text-muted-foreground">Year</p>
                  <p className="text-body-sm font-medium">{ticket.year}</p>
                </div>
                <div>
                  <p className="text-caption text-muted-foreground">Make / Model</p>
                  <p className="text-body-sm font-medium">{ticket.make} {ticket.model}</p>
                </div>
                <div>
                  <p className="text-caption text-muted-foreground">License Plate</p>
                  <p className="text-body-sm font-medium">{ticket.licensePlate}</p>
                </div>
                <div>
                  <p className="text-caption text-muted-foreground">VIN</p>
                  <p className="text-body-sm font-medium font-mono">{ticket.vin}</p>
                </div>
                <div>
                  <p className="text-caption text-muted-foreground">Created</p>
                  <p className="text-body-sm font-medium">{formatDate(ticket.createdAt)}</p>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex items-center gap-3">
                <p className="text-body-sm text-muted-foreground">Update status:</p>
                <Select value={ticket.ticketState} onValueChange={updateStatus}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DOCUMENTED">Documented</SelectItem>
                    <SelectItem value="SERVICING">Servicing</SelectItem>
                    <SelectItem value="READY">Ready</SelectItem>
                    <SelectItem value="DELIVERED">Delivered</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {ticket.images && ticket.images.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera size={16} strokeWidth={1.75} />
                  Photos ({ticket.images.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {ticket.images.map((url, i) => (
                    <div key={i} className="aspect-square rounded-lg overflow-hidden bg-muted">
                      <Image
                        src={url}
                        alt={`Vehicle photo ${i + 1}`}
                        width={300}
                        height={300}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>

        <motion.div variants={staggerItem} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin size={16} strokeWidth={1.75} />
                Parking
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ticket.parking ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-caption text-muted-foreground">Current Lot</p>
                    <p className="text-body-sm font-medium">{ticket.parking.lotName || "Unassigned"}</p>
                  </div>
                  <div>
                    <p className="text-caption text-muted-foreground">Parked At</p>
                    <p className="text-body-sm">{formatDate(ticket.parking.parkedAt)}</p>
                  </div>
                  {ticket.parking.isBlocked && (
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle size={12} /> Blocked
                    </Badge>
                  )}
                </div>
              ) : (
                <p className="text-body-sm text-muted-foreground">No parking assigned</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock size={16} strokeWidth={1.75} />
                Movement History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {movements.length > 0 ? (
                <div className="space-y-4">
                  {movements.map((m) => (
                    <div key={m.id} className="relative pl-4 border-l-2 border-border pb-3">
                      <div className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-primary" />
                      <p className="text-body-sm font-medium">
                        {m.fromLot ? `${m.fromLot} → ${m.toLot}` : `Placed in ${m.toLot}`}
                      </p>
                      <p className="text-caption text-muted-foreground">
                        by {m.movedByEmail} · {formatDate(m.movedAt)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-body-sm text-muted-foreground">No movements recorded</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
