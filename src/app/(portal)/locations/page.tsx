"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  MapPin,
  Loader2,
  Pencil,
  Warehouse,
  Trash2,
  Car,
  Building2,
  Crosshair,
  X,
  Check,
  Navigation,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import {
  MapPinPlacer,
  reverseGeocode,
  type PlacerPin,
} from "@/components/shared/map-pin-placer";
import { pageTransition, staggerContainer, staggerItem, fadeUp } from "@/lib/motion";
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

interface CompanyGeo {
  address: string;
  lat: number | null;
  lng: number | null;
}

type PanelMode = "add" | "edit" | null;

const DEFAULT_CENTER = { lat: 40.7128, lng: -73.9836 };

export default function LocationsPage() {
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedCompany, ready } = useCompany();

  const [companyGeo, setCompanyGeo] = useState<CompanyGeo | null>(null);
  const [settingAddress, setSettingAddress] = useState(false);
  const [addressText, setAddressText] = useState("");
  const [addressResult, setAddressResult] = useState<AddressResult | null>(null);
  const [savingAddress, setSavingAddress] = useState(false);

  const [panelMode, setPanelMode] = useState<PanelMode>(null);
  const [placementMode, setPlacementMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  const [formName, setFormName] = useState("");
  const [formCapacity, setFormCapacity] = useState("50");
  const [formAddress, setFormAddress] = useState("");
  const [formLat, setFormLat] = useState<number | null>(null);
  const [formLng, setFormLng] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleteLoc, setDeleteLoc] = useState<LocationData | null>(null);

  const getSession = useCallback(async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }, []);

  const fetchCompanyGeo = useCallback(async () => {
    if (!selectedCompany) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("companies")
      .select("address, lat, lng")
      .eq("id", selectedCompany.id)
      .single();
    if (data) {
      setCompanyGeo({
        address: data.address || "",
        lat: data.lat ?? null,
        lng: data.lng ?? null,
      });
    }
  }, [selectedCompany]);

  const fetchLocations = useCallback(async () => {
    if (!ready || !selectedCompany) return;
    const session = await getSession();
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
  }, [ready, selectedCompany, getSession]);

  useEffect(() => {
    fetchCompanyGeo();
    fetchLocations();
  }, [fetchCompanyGeo, fetchLocations]);

  async function saveDealershipAddress() {
    if (!addressResult || !selectedCompany) return;
    setSavingAddress(true);
    const session = await getSession();
    if (!session) { setSavingAddress(false); return; }

    await fetch("/api/admin/companies", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        companyId: selectedCompany.id,
        address: addressResult.address,
        city: addressResult.city,
        state: addressResult.state,
        zip: addressResult.zip,
        lat: addressResult.lat,
        lng: addressResult.lng,
      }),
    });

    setCompanyGeo({
      address: addressResult.address,
      lat: addressResult.lat,
      lng: addressResult.lng,
    });
    setSavingAddress(false);
    setSettingAddress(false);
    setAddressText("");
    setAddressResult(null);
  }

  function startAddLocation() {
    setPlacementMode(true);
    setPanelMode(null);
    setEditingId(null);
    resetForm();
  }

  function handlePinPlace(lat: number, lng: number) {
    setFormLat(lat);
    setFormLng(lng);
    setPlacementMode(false);
    if (!panelMode) setPanelMode("add");
    reverseGeocode(lat, lng).then((addr) => {
      setFormAddress(addr);
    });
  }

  function startEditLocation(loc: LocationData) {
    setEditingId(loc.id);
    setHighlightId(loc.id);
    setFormName(loc.name);
    setFormCapacity(String(loc.capacity));
    setFormAddress(loc.address || "");
    setFormLat(loc.lat);
    setFormLng(loc.lng);
    setPanelMode("edit");
    setPlacementMode(true);
  }

  function resetForm() {
    setFormName("");
    setFormCapacity("50");
    setFormAddress("");
    setFormLat(null);
    setFormLng(null);
  }

  function closePanel() {
    setPanelMode(null);
    setPlacementMode(false);
    setEditingId(null);
    setHighlightId(null);
    resetForm();
  }

  async function handleSave() {
    if (!formName.trim() || !selectedCompany) return;
    setSaving(true);
    const session = await getSession();
    if (!session) { setSaving(false); return; }

    const headers = {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    };

    if (panelMode === "add") {
      await fetch(`/api/locations?companyId=${selectedCompany.id}`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: formName,
          address: formAddress || "",
          lat: formLat,
          lng: formLng,
          capacity: parseInt(formCapacity) || 0,
        }),
      });
    } else if (panelMode === "edit" && editingId) {
      await fetch("/api/locations", {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          locationId: editingId,
          name: formName,
          address: formAddress || "",
          lat: formLat,
          lng: formLng,
          capacity: parseInt(formCapacity) || 0,
        }),
      });
    }

    setSaving(false);
    closePanel();
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

  const mapCenter =
    companyGeo?.lat && companyGeo?.lng
      ? { lat: companyGeo.lat, lng: companyGeo.lng }
      : locations.find((l) => l.lat && l.lng)
        ? { lat: locations.find((l) => l.lat && l.lng)!.lat!, lng: locations.find((l) => l.lat && l.lng)!.lng! }
        : DEFAULT_CENTER;

  const hasGeo = !!(companyGeo?.lat && companyGeo?.lng);

  const existingPins: PlacerPin[] = locations
    .filter((l) => l.lat && l.lng && l.id !== editingId)
    .map((l) => ({ lat: l.lat!, lng: l.lng!, label: l.name, id: l.id }));

  const activePin =
    formLat && formLng ? { lat: formLat, lng: formLng } : null;

  const totalCapacity = locations.reduce((s, l) => s + l.capacity, 0);
  const totalOccupied = locations.reduce((s, l) => s + l.occupied, 0);

  return (
    <motion.div variants={pageTransition} initial="hidden" animate="visible">
      <PageHeader
        title="Locations & Parking"
        description="Configure parking areas around your dealership"
      />

      {/* Dealership address anchor */}
      <motion.div variants={staggerItem} className="mb-4">
        <Card>
          <CardContent className="p-4">
            {!hasGeo && !settingAddress ? (
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-brand-500/10 p-2">
                    <Building2 size={18} className="text-brand-500" />
                  </div>
                  <div>
                    <p className="text-body-sm font-medium">
                      Set your dealership address
                    </p>
                    <p className="text-caption text-muted-foreground">
                      This centers the map so you can drop pins for parking areas nearby
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => setSettingAddress(true)}
                >
                  <Navigation size={14} />
                  Set Address
                </Button>
              </div>
            ) : settingAddress ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="rounded-lg bg-brand-500/10 p-2">
                    <Building2 size={18} className="text-brand-500" />
                  </div>
                  <p className="text-body-sm font-medium">
                    Dealership Address
                  </p>
                </div>
                <AddressAutocomplete
                  value={addressText}
                  onChange={setAddressText}
                  onSelect={setAddressResult}
                  placeholder="Search your dealership address…"
                />
                <div className="flex items-center gap-2 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSettingAddress(false);
                      setAddressText("");
                      setAddressResult(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={saveDealershipAddress}
                    disabled={!addressResult || savingAddress}
                  >
                    {savingAddress && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-brand-500/10 p-2">
                    <Building2 size={18} className="text-brand-500" />
                  </div>
                  <div>
                    <p className="text-body-sm font-medium">
                      {selectedCompany?.name}
                    </p>
                    <p className="text-caption text-muted-foreground line-clamp-1">
                      {companyGeo?.address}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSettingAddress(true);
                    setAddressText(companyGeo?.address || "");
                  }}
                  className="text-muted-foreground"
                >
                  <Pencil size={13} />
                  Edit
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Map + floating controls */}
      <motion.div variants={staggerItem} className="mb-4 relative">
        <MapPinPlacer
          center={mapCenter}
          existingPins={existingPins}
          activePin={activePin}
          highlightId={highlightId}
          placementMode={placementMode}
          onPinPlace={handlePinPlace}
          onPinClick={(id) => {
            setHighlightId(id);
            const loc = locations.find((l) => l.id === id);
            if (loc) startEditLocation(loc);
          }}
          zoom={hasGeo ? 16 : 12}
          className="h-[400px]"
        />

        {/* Floating stats */}
        {!loading && locations.length > 0 && (
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <div className="glass rounded-lg px-3 py-1.5 text-caption text-white">
              <span className="font-semibold">{totalCapacity}</span>
              <span className="text-white/50 ml-1">spots</span>
            </div>
            <div className="glass rounded-lg px-3 py-1.5 text-caption text-white">
              <span className="font-semibold text-brand-500">{totalOccupied}</span>
              <span className="text-white/50 ml-1">occupied</span>
            </div>
            <div className="glass rounded-lg px-3 py-1.5 text-caption text-white">
              <span className="font-semibold text-emerald-400">{totalCapacity - totalOccupied}</span>
              <span className="text-white/50 ml-1">free</span>
            </div>
          </div>
        )}

        {/* Floating add button / placement indicator */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          {placementMode && !panelMode ? (
            <>
              <div className="glass rounded-lg px-3 py-2 text-caption text-white flex items-center gap-2">
                <Crosshair size={14} className="text-brand-500" />
                Click the map to drop a pin
              </div>
              <Button
                size="sm"
                variant="secondary"
                className="shadow-lg"
                onClick={closePanel}
              >
                <X size={14} />
                Cancel
              </Button>
            </>
          ) : !panelMode ? (
            <Button
              size="sm"
              className="shadow-lg"
              onClick={startAddLocation}
              disabled={!hasGeo}
              title={!hasGeo ? "Set your dealership address first" : ""}
            >
              <Plus size={14} />
              Add Location
            </Button>
          ) : null}
        </div>
      </motion.div>

      {/* Side panel for add/edit */}
      <AnimatePresence>
        {panelMode && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] as const } }}
            exit={{ opacity: 0, y: 16, transition: { duration: 0.15 } }}
            className="mb-4"
          >
            <Card className="border-brand-500/30">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-heading-3 flex items-center gap-2">
                    <MapPin size={16} className="text-brand-500" />
                    {panelMode === "add" ? "New Parking Location" : "Edit Location"}
                  </h3>
                  <Button variant="ghost" size="icon-xs" onClick={closePanel}>
                    <X size={14} />
                  </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Location Name</Label>
                    <Input
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Main Lot, Overflow, Service Bay"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Capacity (spots)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={formCapacity}
                      onChange={(e) => setFormCapacity(e.target.value)}
                      placeholder="50"
                    />
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <Label className="flex items-center justify-between">
                    <span>Address</span>
                    <span className="text-caption text-muted-foreground font-normal">
                      {formLat && formLng
                        ? `${formLat.toFixed(5)}, ${formLng.toFixed(5)}`
                        : "Drop a pin or search"}
                    </span>
                  </Label>
                  <AddressAutocomplete
                    value={formAddress}
                    onChange={setFormAddress}
                    onSelect={(r) => {
                      setFormAddress(r.address);
                      setFormLat(r.lat);
                      setFormLng(r.lng);
                    }}
                    placeholder="Auto-filled from pin — or search to override"
                  />
                  {!formLat && !formLng && (
                    <p className="text-caption text-muted-foreground flex items-center gap-1.5">
                      <Crosshair size={12} />
                      Click the map above to place the pin, or search an address
                    </p>
                  )}
                </div>

                <div className="mt-5 flex items-center justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={closePanel}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={saving || !formName.trim()}
                  >
                    {saving ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check size={14} />
                    )}
                    {panelMode === "add" ? "Create Location" : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Location list */}
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : locations.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No parking locations yet"
          description={
            hasGeo
              ? 'Click "Add Location" and drop a pin on the map to mark your first parking area'
              : "Set your dealership address above, then add parking locations around it"
          }
          actionLabel={hasGeo ? "Add First Location" : undefined}
          onAction={hasGeo ? startAddLocation : undefined}
        />
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          {locations.map((loc) => {
            const pct = loc.capacity > 0 ? Math.round((loc.occupied / loc.capacity) * 100) : 0;
            const isFull = loc.capacity > 0 && loc.occupied >= loc.capacity;
            const isHighlighted = highlightId === loc.id;

            return (
              <motion.div key={loc.id} variants={staggerItem}>
                <Card
                  className={`group relative cursor-pointer transition-all duration-200 ${
                    isHighlighted
                      ? "ring-2 ring-brand-500/50 border-brand-500/30"
                      : "hover:border-border"
                  }`}
                  onClick={() => setHighlightId(loc.id === highlightId ? null : loc.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Warehouse
                          size={15}
                          strokeWidth={1.75}
                          className="text-primary shrink-0"
                        />
                        <span className="text-body-sm font-semibold truncate">
                          {loc.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditLocation(loc);
                          }}
                          title="Edit"
                        >
                          <Pencil size={12} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteLoc(loc);
                          }}
                          className="text-destructive hover:text-destructive"
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </div>

                    {loc.address && (
                      <p className="text-caption text-muted-foreground mb-2 line-clamp-1">
                        {loc.address}
                      </p>
                    )}

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-caption">
                        <span className="flex items-center gap-1">
                          <Car size={12} className="text-muted-foreground" />
                          <span className="font-medium">
                            {loc.occupied}
                            <span className="text-muted-foreground font-normal">
                              /{loc.capacity}
                            </span>
                          </span>
                        </span>
                        {isFull ? (
                          <Badge variant="destructive" className="text-[9px] px-1.5 py-0">
                            FULL
                          </Badge>
                        ) : (
                          <span className="text-emerald-500 font-medium">
                            {loc.available} free
                          </span>
                        )}
                      </div>
                      <Progress value={pct} className="h-1.5" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteLoc}
        onOpenChange={(o) => !o && setDeleteLoc(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteLoc?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the parking location. Vehicles currently parked
              here will need to be moved.
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
