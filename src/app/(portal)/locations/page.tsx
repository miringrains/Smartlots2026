"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  MapPin,
  Loader2,
  Pencil,
  Warehouse,
  Trash2,
  Car,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import {
  AddressAutocomplete,
  type AddressResult,
} from "@/components/shared/address-autocomplete";
import { MapPreview, type MapPin as MapPinType } from "@/components/shared/map-preview";
import { pageTransition, staggerContainer, staggerItem } from "@/lib/motion";
import { createClient } from "@/lib/supabase/client";
import { useCompany } from "@/lib/company-context";

interface LocationData {
  id: string;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  capacity: number;
  occupied: number;
  available: number;
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const { selectedCompany, ready } = useCompany();

  /* ---- create form ---- */
  const [newName, setNewName] = useState("");
  const [newAddressText, setNewAddressText] = useState("");
  const [newGeo, setNewGeo] = useState<AddressResult | null>(null);
  const [newCapacity, setNewCapacity] = useState("0");

  /* ---- edit form ---- */
  const [editOpen, setEditOpen] = useState(false);
  const [editLoc, setEditLoc] = useState<LocationData | null>(null);
  const [editName, setEditName] = useState("");
  const [editAddressText, setEditAddressText] = useState("");
  const [editGeo, setEditGeo] = useState<AddressResult | null>(null);
  const [editCapacity, setEditCapacity] = useState("0");
  const [saving, setSaving] = useState(false);

  /* ---- delete ---- */
  const [deleteLoc, setDeleteLoc] = useState<LocationData | null>(null);

  async function fetchLocations() {
    if (!ready || !selectedCompany) return;

    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    const res = await fetch(
      `/api/locations?companyId=${selectedCompany.id}`,
      { headers: { Authorization: `Bearer ${session.access_token}` } }
    );

    if (res.ok) {
      const json = await res.json();
      setLocations(json.data || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchLocations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, selectedCompany]);

  async function createLocation() {
    if (!newName.trim() || !selectedCompany) return;
    setCreating(true);

    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setCreating(false);
      return;
    }

    await fetch(`/api/locations?companyId=${selectedCompany.id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: newName,
        address: newGeo?.address || newAddressText || "",
        lat: newGeo?.lat ?? null,
        lng: newGeo?.lng ?? null,
        capacity: parseInt(newCapacity) || 0,
      }),
    });

    setNewName("");
    setNewAddressText("");
    setNewGeo(null);
    setNewCapacity("0");
    setCreating(false);
    setCreateOpen(false);
    fetchLocations();
  }

  function openEdit(loc: LocationData) {
    setEditLoc(loc);
    setEditName(loc.name);
    setEditAddressText(loc.address);
    setEditCapacity(String(loc.capacity));
    setEditGeo(
      loc.lat && loc.lng
        ? {
            address: loc.address,
            city: "",
            state: "",
            zip: "",
            lat: loc.lat,
            lng: loc.lng,
            fullText: loc.address,
          }
        : null
    );
    setEditOpen(true);
  }

  async function handleSaveEdit() {
    if (!editLoc) return;
    setSaving(true);

    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setSaving(false);
      return;
    }

    await fetch("/api/locations", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        locationId: editLoc.id,
        name: editName,
        address: editGeo?.address || editAddressText,
        lat: editGeo?.lat ?? editLoc.lat,
        lng: editGeo?.lng ?? editLoc.lng,
        capacity: parseInt(editCapacity) || 0,
      }),
    });

    setSaving(false);
    setEditOpen(false);
    setEditLoc(null);
    fetchLocations();
  }

  async function handleDelete() {
    if (!deleteLoc) return;
    const supabase = createClient();

    await supabase
      .from("locations")
      .update({ is_deleted: true })
      .eq("id", deleteLoc.id);

    setDeleteLoc(null);
    fetchLocations();
  }

  const mapPins: MapPinType[] = locations
    .filter((l) => l.lat && l.lng)
    .map((l) => ({
      lat: l.lat!,
      lng: l.lng!,
      label: l.name,
    }));

  const totalCapacity = locations.reduce((s, l) => s + l.capacity, 0);
  const totalOccupied = locations.reduce((s, l) => s + l.occupied, 0);

  return (
    <motion.div variants={pageTransition} initial="hidden" animate="visible">
      <PageHeader
        title="Locations"
        description="Manage areas within the dealership where vehicles are stored"
      >
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus size={14} />
              Add Location
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>New Location</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Main Lot, Service Bay, Overflow"
                />
              </div>
              <div className="space-y-2">
                <Label>Total Spots</Label>
                <Input
                  type="number"
                  min={0}
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(e.target.value)}
                  placeholder="50"
                />
                <p className="text-caption text-muted-foreground">
                  How many vehicles can this location hold?
                </p>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <AddressAutocomplete
                  value={newAddressText}
                  onChange={setNewAddressText}
                  onSelect={(r) => setNewGeo(r)}
                  placeholder="Search for location address…"
                />
                {newGeo && (
                  <MapPreview
                    pins={[
                      {
                        lat: newGeo.lat,
                        lng: newGeo.lng,
                        label: newName || "New Location",
                      },
                    ]}
                    zoom={16}
                    className="h-[160px] mt-2"
                  />
                )}
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button
                onClick={createLocation}
                disabled={creating || !newName.trim()}
              >
                {creating && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Summary stats */}
      {!loading && locations.length > 0 && (
        <motion.div variants={staggerItem} className="mb-6">
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-caption text-muted-foreground">
                  Total Capacity
                </p>
                <p className="text-2xl font-bold">{totalCapacity}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-caption text-muted-foreground">Occupied</p>
                <p className="text-2xl font-bold text-primary">
                  {totalOccupied}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-caption text-muted-foreground">Available</p>
                <p className="text-2xl font-bold text-emerald-500">
                  {totalCapacity - totalOccupied}
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}

      {/* Map with all location pins */}
      {!loading && mapPins.length > 0 && (
        <motion.div variants={staggerItem} className="mb-6">
          <MapPreview
            pins={mapPins}
            zoom={mapPins.length === 1 ? 15 : 12}
            className="h-[260px]"
            interactive
          />
        </motion.div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : locations.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No locations yet"
          description="Add your first location — like Main Lot, Service Bay, or Overflow"
        />
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {locations.map((loc) => {
            const pct =
              loc.capacity > 0
                ? Math.round((loc.occupied / loc.capacity) * 100)
                : 0;
            const isFull = loc.capacity > 0 && loc.occupied >= loc.capacity;

            return (
              <motion.div key={loc.id} variants={staggerItem}>
                <Card className="group relative overflow-hidden">
                  {loc.lat && loc.lng && (
                    <div className="h-[100px] w-full">
                      <MapPreview
                        pins={[
                          { lat: loc.lat, lng: loc.lng, label: loc.name },
                        ]}
                        zoom={15}
                        className="h-full w-full rounded-none border-0"
                      />
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-heading-3">
                        <Warehouse
                          size={16}
                          strokeWidth={1.75}
                          className="text-primary"
                        />
                        {loc.name}
                      </span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => openEdit(loc)}
                          title="Edit location"
                        >
                          <Pencil size={13} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => setDeleteLoc(loc)}
                          className="text-destructive hover:text-destructive"
                          title="Delete location"
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loc.address && (
                      <p className="text-body-sm text-muted-foreground mb-3 line-clamp-1">
                        {loc.address}
                      </p>
                    )}

                    {/* Occupancy bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-body-sm">
                        <span className="flex items-center gap-1.5">
                          <Car size={14} className="text-muted-foreground" />
                          <span className="font-medium">
                            {loc.occupied}
                            <span className="text-muted-foreground font-normal">
                              {" "}
                              / {loc.capacity}
                            </span>
                          </span>
                        </span>
                        {isFull ? (
                          <Badge variant="destructive" className="text-[10px]">
                            FULL
                          </Badge>
                        ) : (
                          <span className="text-emerald-500 text-body-sm font-medium">
                            {loc.available} available
                          </span>
                        )}
                      </div>
                      <Progress
                        value={pct}
                        className="h-2"
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Location</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Total Spots</Label>
              <Input
                type="number"
                min={0}
                value={editCapacity}
                onChange={(e) => setEditCapacity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <AddressAutocomplete
                value={editAddressText}
                onChange={setEditAddressText}
                onSelect={(r) => setEditGeo(r)}
              />
              {(editGeo?.lat || editLoc?.lat) && (
                <MapPreview
                  pins={[
                    {
                      lat: editGeo?.lat || editLoc!.lat!,
                      lng: editGeo?.lng || editLoc!.lng!,
                      label: editName,
                    },
                  ]}
                  zoom={15}
                  className="h-[160px] mt-2"
                />
              )}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteLoc}
        onOpenChange={(o) => !o && setDeleteLoc(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteLoc?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will soft-delete the location. Vehicles currently parked here
              will need to be moved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
