"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, MapPin, Building2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { pageTransition, staggerContainer, staggerItem } from "@/lib/motion";
import { createClient } from "@/lib/supabase/client";

interface LocationData {
  id: string;
  name: string;
  address: string;
  company_id: string;
  created_at: string;
  lotCount?: number;
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");

  async function fetchLocations() {
    const supabase = createClient();
    const { data } = await supabase
      .from("locations")
      .select("*, lots(id)")
      .eq("is_deleted", false)
      .order("name");

    if (data) {
      setLocations(
        data.map((l) => ({
          id: l.id,
          name: l.name,
          address: l.address,
          company_id: l.company_id,
          created_at: l.created_at,
          lotCount: l.lots?.length || 0,
        }))
      );
    }
    setLoading(false);
  }

  useEffect(() => { fetchLocations(); }, []);

  async function createLocation() {
    if (!newName.trim() || !newAddress.trim()) return;
    setCreating(true);
    const supabase = createClient();

    const { data: profile } = await supabase
      .from("users")
      .select("company_id")
      .eq("id", (await supabase.auth.getUser()).data.user?.id || "")
      .single();

    if (profile?.company_id) {
      await supabase.from("locations").insert({
        name: newName,
        address: newAddress,
        company_id: profile.company_id,
      });
    }

    setNewName("");
    setNewAddress("");
    setCreating(false);
    fetchLocations();
  }

  return (
    <motion.div variants={pageTransition} initial="hidden" animate="visible">
      <PageHeader title="Locations" description="Manage your business locations">
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus size={14} />
              Add Location
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Location</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Miami Garage"
                />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="123 Main St, Miami, FL"
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={createLocation} disabled={creating || !newName.trim()}>
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : locations.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No locations yet"
          description="Add your first location to start managing parking"
        />
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {locations.map((loc) => (
            <motion.div key={loc.id} variants={staggerItem}>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-heading-3">
                    <Building2 size={16} strokeWidth={1.75} className="text-primary" />
                    {loc.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-body-sm text-muted-foreground mb-3">{loc.address}</p>
                  <div className="flex items-center gap-1 text-caption text-muted-foreground">
                    <MapPin size={12} />
                    {loc.lotCount} lot{loc.lotCount !== 1 ? "s" : ""}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
