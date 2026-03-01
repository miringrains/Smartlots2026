"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, ParkingSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { pageTransition, staggerContainer, staggerItem } from "@/lib/motion";
import { createClient } from "@/lib/supabase/client";
import type { LotDTO, OccupancyDTO } from "@/lib/dto";

interface LocationOption {
  id: string;
  name: string;
}

export default function LotsPage() {
  const [lots, setLots] = useState<LotDTO[]>([]);
  const [stats, setStats] = useState<OccupancyDTO[]>([]);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [isAdminPlus, setIsAdminPlus] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newLotName, setNewLotName] = useState("");
  const [newSpots, setNewSpots] = useState("");
  const [newLocationId, setNewLocationId] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;
    const headers = { Authorization: `Bearer ${session.access_token}` };

    const { data: me } = await supabase
      .from("users")
      .select("user_type, location_id")
      .eq("id", session.user.id)
      .single();

    if (me) {
      const admin =
        me.user_type === "ADMIN" || me.user_type === "SUPER_ADMIN";
      setIsAdminPlus(admin);
      setNewLocationId(me.location_id || "");
    }

    const { data: locData } = await supabase
      .from("locations")
      .select("id, name")
      .eq("is_deleted", false)
      .order("name");

    if (locData) setLocations(locData);

    const [lotsRes, statsRes] = await Promise.all([
      fetch("/api/lots", { headers }),
      fetch("/api/lots/statistics", { headers }),
    ]);

    const lotsData = await lotsRes.json();
    const statsData = await statsRes.json();
    setLots(lotsData.data || []);
    setStats(statsData.data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function createLot() {
    if (!newLotName.trim()) return;
    setCreating(true);
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    const spotLabels = newSpots
      ? newSpots
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    await fetch("/api/lots", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: newLotName,
        spots: spotLabels,
        locationId: newLocationId || undefined,
      }),
    });

    setNewLotName("");
    setNewSpots("");
    setCreating(false);
    fetchData();
  }

  const getStats = (lotId: string) =>
    stats.find((s) => s.id === lotId) || {
      totalSpots: 0,
      occupiedSpots: 0,
      availableSpots: 0,
      occupancyRate: 0,
    };

  return (
    <motion.div variants={pageTransition} initial="hidden" animate="visible">
      <PageHeader
        title="Lots & Parking"
        description="Manage parking lots and spots"
      >
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus size={14} />
              New Lot
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Lot</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {isAdminPlus && locations.length > 1 && (
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Select
                    value={newLocationId}
                    onValueChange={setNewLocationId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((loc) => (
                        <SelectItem key={loc.id} value={loc.id}>
                          {loc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>Lot Name</Label>
                <Input
                  value={newLotName}
                  onChange={(e) => setNewLotName(e.target.value)}
                  placeholder="e.g. Lot A"
                />
              </div>
              <div className="space-y-2">
                <Label>Spots (comma-separated labels)</Label>
                <Input
                  value={newSpots}
                  onChange={(e) => setNewSpots(e.target.value)}
                  placeholder="e.g. A1, A2, A3, A4"
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button
                onClick={createLot}
                disabled={creating || !newLotName.trim()}
              >
                {creating ? "Creating..." : "Create Lot"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-40 bg-muted rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : lots.length === 0 ? (
        <EmptyState
          icon={ParkingSquare}
          title="No lots yet"
          description="Create your first parking lot to get started"
        />
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {lots.map((lot) => {
            const lotStats = getStats(lot.id);
            return (
              <motion.div key={lot.id} variants={staggerItem}>
                <Link href={`/lots/${lot.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <ParkingSquare
                            size={16}
                            strokeWidth={1.75}
                            className="text-primary"
                          />
                          {lot.name}
                        </span>
                        <span className="text-caption text-muted-foreground font-normal">
                          {lot.spots.length} spots
                        </span>
                      </CardTitle>
                      {lot.location && (
                        <p className="text-caption text-muted-foreground">
                          {lot.location.name}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-caption text-muted-foreground">
                          <span>{lotStats.occupiedSpots} occupied</span>
                          <span>{lotStats.availableSpots} available</span>
                        </div>
                        <Progress value={lotStats.occupancyRate} />
                        <p className="text-caption text-right text-muted-foreground">
                          {lotStats.occupancyRate}% full
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}
