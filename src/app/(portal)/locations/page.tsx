"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  MapPin,
  Building2,
  Loader2,
  Pencil,
  Warehouse,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  company_id: string;
  created_at: string;
  lotCount: number;
  userCount: number;
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

  /* ---- edit form ---- */
  const [editOpen, setEditOpen] = useState(false);
  const [editLoc, setEditLoc] = useState<LocationData | null>(null);
  const [editName, setEditName] = useState("");
  const [editAddressText, setEditAddressText] = useState("");
  const [editGeo, setEditGeo] = useState<AddressResult | null>(null);
  const [saving, setSaving] = useState(false);

  /* ---- delete ---- */
  const [deleteLoc, setDeleteLoc] = useState<LocationData | null>(null);

  async function fetchLocations() {
    if (!ready || !selectedCompany) return;

    const supabase = createClient();
    const { data } = await supabase
      .from("locations")
      .select("*, lots(id), users:users(id)")
      .eq("company_id", selectedCompany.id)
      .eq("is_deleted", false)
      .order("name");

    if (data) {
      setLocations(
        data.map((l: any) => ({
          id: l.id,
          name: l.name,
          address: l.address,
          lat: l.lat ?? null,
          lng: l.lng ?? null,
          company_id: l.company_id,
          created_at: l.created_at,
          lotCount: l.lots?.length || 0,
          userCount: l.users?.length || 0,
        }))
      );
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

    await supabase.from("locations").insert({
      name: newName,
      address: newGeo?.address || newAddressText || "",
      lat: newGeo?.lat ?? null,
      lng: newGeo?.lng ?? null,
      company_id: selectedCompany.id,
    });

    setNewName("");
    setNewAddressText("");
    setNewGeo(null);
    setCreating(false);
    setCreateOpen(false);
    fetchLocations();
  }

  function openEdit(loc: LocationData) {
    setEditLoc(loc);
    setEditName(loc.name);
    setEditAddressText(loc.address);
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

    await supabase
      .from("locations")
      .update({
        name: editName,
        address: editGeo?.address || editAddressText,
        lat: editGeo?.lat ?? editLoc.lat,
        lng: editGeo?.lng ?? editLoc.lng,
      })
      .eq("id", editLoc.id);

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

  return (
    <motion.div variants={pageTransition} initial="hidden" animate="visible">
      <PageHeader
        title="Locations"
        description="Manage areas within your dealership where vehicles are stored"
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
                  placeholder="e.g. Front Lot, Service Bay, Overflow"
                />
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

      {/* Map with all location pins */}
      {!loading && mapPins.length > 0 && (
        <motion.div variants={staggerItem} className="mb-6">
          <MapPreview
            pins={mapPins}
            zoom={mapPins.length === 1 ? 15 : 12}
            className="h-[280px]"
            interactive
          />
        </motion.div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : locations.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No locations yet"
          description="Add your first location — like Front Lot, Service Bay, or Overflow"
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
              <Card className="group relative overflow-hidden">
                {loc.lat && loc.lng && (
                  <div className="h-[120px] w-full">
                    <MapPreview
                      pins={[{ lat: loc.lat, lng: loc.lng, label: loc.name }]}
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
                  <p className="text-body-sm text-muted-foreground mb-3 line-clamp-2">
                    {loc.address || (
                      <span className="italic text-muted-foreground/50">
                        No address set
                      </span>
                    )}
                  </p>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="gap-1 text-[11px]">
                      <Warehouse size={10} />
                      {loc.lotCount} lot{loc.lotCount !== 1 ? "s" : ""}
                    </Badge>
                    <Badge variant="outline" className="gap-1 text-[11px]">
                      <Building2 size={10} />
                      {loc.userCount} staff
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
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
              This will soft-delete the location. Any lots and staff assigned to
              it will need to be reassigned.
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
