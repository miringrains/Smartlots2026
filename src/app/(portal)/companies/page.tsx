"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Plus,
  Building2,
  Loader2,
  MapPin,
  Users,
  ArrowRight,
  Phone,
  Pencil,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import {
  AddressAutocomplete,
  type AddressResult,
} from "@/components/shared/address-autocomplete";
import { MapPreview, type MapPin as MapPinType } from "@/components/shared/map-preview";
import { pageTransition, staggerItem } from "@/lib/motion";
import { createClient } from "@/lib/supabase/client";
import { useCompany } from "@/lib/company-context";
import { formatDateShort } from "@/lib/utils";

interface CompanyRow {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  lat: number | null;
  lng: number | null;
  phone: string;
  createdAt: string;
  locationCount: number;
  userCount: number;
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editCompany, setEditCompany] = useState<CompanyRow | null>(null);
  const [saving, setSaving] = useState(false);
  const { selectedCompany, setSelectedCompany } = useCompany();
  const router = useRouter();

  /* ---- create form state ---- */
  const [companyName, setCompanyName] = useState("");
  const [addressText, setAddressText] = useState("");
  const [geo, setGeo] = useState<AddressResult | null>(null);
  const [phone, setPhone] = useState("");
  const [locName, setLocName] = useState("");
  const [locAddressText, setLocAddressText] = useState("");
  const [locGeo, setLocGeo] = useState<AddressResult | null>(null);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  /* ---- edit form state ---- */
  const [editAddressText, setEditAddressText] = useState("");
  const [editGeo, setEditGeo] = useState<AddressResult | null>(null);
  const [editPhone, setEditPhone] = useState("");

  const getSession = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  }, []);

  async function fetchCompanies() {
    const session = await getSession();
    if (!session) return;

    const res = await fetch("/api/admin/companies", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (res.ok) {
      const json = await res.json();
      setCompanies(json.data || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate() {
    if (!companyName.trim()) return;
    setCreating(true);

    const session = await getSession();
    if (!session) {
      setCreating(false);
      return;
    }

    await fetch("/api/admin/companies", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: companyName,
        address: geo?.address || addressText,
        city: geo?.city || "",
        state: geo?.state || "",
        zip: geo?.zip || "",
        lat: geo?.lat ?? null,
        lng: geo?.lng ?? null,
        phone,
        location: locName
          ? {
              name: locName,
              address: locGeo?.address || locAddressText,
              lat: locGeo?.lat ?? null,
              lng: locGeo?.lng ?? null,
            }
          : undefined,
        adminUser:
          adminEmail && adminPassword
            ? { email: adminEmail, password: adminPassword }
            : undefined,
      }),
    });

    setCompanyName("");
    setAddressText("");
    setGeo(null);
    setPhone("");
    setLocName("");
    setLocAddressText("");
    setLocGeo(null);
    setAdminEmail("");
    setAdminPassword("");
    setCreating(false);
    setCreateOpen(false);
    fetchCompanies();
  }

  function openEdit(c: CompanyRow, e: React.MouseEvent) {
    e.stopPropagation();
    setEditCompany(c);
    setEditAddressText(c.address || "");
    setEditGeo(
      c.lat && c.lng
        ? {
            address: c.address,
            city: c.city,
            state: c.state,
            zip: c.zip,
            lat: c.lat,
            lng: c.lng,
            fullText: c.address,
          }
        : null
    );
    setEditPhone(c.phone || "");
    setEditOpen(true);
  }

  async function handleSaveEdit() {
    if (!editCompany) return;
    setSaving(true);

    const session = await getSession();
    if (!session) {
      setSaving(false);
      return;
    }

    await fetch("/api/admin/companies", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        companyId: editCompany.id,
        address: editGeo?.address || editAddressText,
        city: editGeo?.city || editCompany.city,
        state: editGeo?.state || editCompany.state,
        zip: editGeo?.zip || editCompany.zip,
        lat: editGeo?.lat ?? editCompany.lat,
        lng: editGeo?.lng ?? editCompany.lng,
        phone: editPhone,
      }),
    });

    setSaving(false);
    setEditOpen(false);
    setEditCompany(null);
    fetchCompanies();
  }

  const allPins: MapPinType[] = companies
    .filter((c) => c.lat && c.lng)
    .map((c) => ({
      lat: c.lat!,
      lng: c.lng!,
      label: c.name,
    }));

  return (
    <motion.div variants={pageTransition} initial="hidden" animate="visible">
      <PageHeader title="Companies" description="Onboard and manage dealerships">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus size={14} />
              New Company
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Onboard New Dealership</DialogTitle>
            </DialogHeader>
            <div className="space-y-5 py-2">
              <div className="space-y-2">
                <Label className="font-semibold">Company Name</Label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Acme Motors"
                />
              </div>

              <div className="space-y-2">
                <Label className="font-semibold">Dealership Address</Label>
                <AddressAutocomplete
                  value={addressText}
                  onChange={setAddressText}
                  onSelect={(r) => setGeo(r)}
                  placeholder="Search for dealership address…"
                />
                {geo && (
                  <div className="rounded-lg overflow-hidden mt-2">
                    <MapPreview
                      pins={[{ lat: geo.lat, lng: geo.lng, label: companyName || "Dealership" }]}
                      zoom={15}
                      className="h-[180px]"
                    />
                    <div className="flex items-center gap-2 mt-2 text-body-sm text-muted-foreground">
                      <MapPin size={12} className="text-primary" />
                      {geo.city && <span>{geo.city},</span>}
                      {geo.state && <span>{geo.state}</span>}
                      {geo.zip && <span>{geo.zip}</span>}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>

              <Separator />

              <div>
                <p className="text-body-sm font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
                  <MapPin size={14} /> First Location (optional)
                </p>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Location Name</Label>
                    <Input
                      value={locName}
                      onChange={(e) => setLocName(e.target.value)}
                      placeholder="e.g. Main Lot, Service Bay"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Location Address</Label>
                    <AddressAutocomplete
                      value={locAddressText}
                      onChange={setLocAddressText}
                      onSelect={(r) => setLocGeo(r)}
                      placeholder="Search address…"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-body-sm font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
                  <Users size={14} /> Admin User (optional)
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="manager@acme.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Temp password"
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button
                onClick={handleCreate}
                disabled={creating || !companyName.trim()}
              >
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Company
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Map overview — shows all dealerships with coordinates */}
      {!loading && allPins.length > 0 && (
        <motion.div variants={staggerItem} className="mb-6">
          <MapPreview
            pins={allPins}
            zoom={4}
            className="h-[260px]"
            interactive
          />
        </motion.div>
      )}

      <motion.div variants={staggerItem}>
        <Card>
          <CardContent className="p-4">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : companies.length === 0 ? (
              <EmptyState
                icon={Building2}
                title="No companies"
                description="Onboard your first dealership"
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead className="hidden md:table-cell">Address</TableHead>
                    <TableHead className="text-center">Locations</TableHead>
                    <TableHead className="text-center">Users</TableHead>
                    <TableHead className="hidden lg:table-cell">Created</TableHead>
                    <TableHead className="w-20" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((c) => {
                    const isActive = selectedCompany?.id === c.id;
                    return (
                      <TableRow
                        key={c.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          setSelectedCompany({ id: c.id, name: c.name });
                          router.push("/dashboard");
                        }}
                      >
                        <TableCell className="font-medium">
                          <span className="flex items-center gap-2">
                            <Building2
                              size={14}
                              className={
                                isActive
                                  ? "text-primary"
                                  : "text-muted-foreground"
                              }
                            />
                            <span>
                              {c.name}
                              {c.phone && (
                                <span className="block text-caption text-muted-foreground font-normal flex items-center gap-1 mt-0.5">
                                  <Phone size={10} /> {c.phone}
                                </span>
                              )}
                            </span>
                            {isActive && (
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                Active
                              </span>
                            )}
                          </span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-body-sm text-muted-foreground max-w-[220px] truncate">
                          {c.address || (
                            <span className="italic text-muted-foreground/50">
                              No address
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {c.locationCount}
                        </TableCell>
                        <TableCell className="text-center">
                          {c.userCount}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground">
                          {formatDateShort(c.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={(e) => openEdit(c, e)}
                              title="Edit address"
                            >
                              <Pencil size={13} />
                            </Button>
                            <ArrowRight
                              size={14}
                              className="text-muted-foreground"
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Edit address dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Edit {editCompany?.name || "Company"} Details
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="font-semibold">Dealership Address</Label>
              <AddressAutocomplete
                value={editAddressText}
                onChange={setEditAddressText}
                onSelect={(r) => setEditGeo(r)}
                placeholder="Search for dealership address…"
              />
              {(editGeo?.lat || editCompany?.lat) && (
                <div className="mt-2">
                  <MapPreview
                    pins={[
                      {
                        lat: editGeo?.lat || editCompany!.lat!,
                        lng: editGeo?.lng || editCompany!.lng!,
                        label: editCompany?.name || "",
                      },
                    ]}
                    zoom={15}
                    className="h-[180px]"
                  />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
