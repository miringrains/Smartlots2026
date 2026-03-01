"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Building2, Loader2, MapPin, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
import { pageTransition, staggerItem } from "@/lib/motion";
import { createClient } from "@/lib/supabase/client";
import { formatDateShort } from "@/lib/utils";

interface CompanyRow {
  id: string;
  name: string;
  createdAt: string;
  locationCount: number;
  userCount: number;
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState(false);

  const [companyName, setCompanyName] = useState("");
  const [locName, setLocName] = useState("");
  const [locAddress, setLocAddress] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  async function fetchCompanies() {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
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
  }, []);

  async function handleCreate() {
    if (!companyName.trim()) return;
    setCreating(true);

    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
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
        location: locName ? { name: locName, address: locAddress } : undefined,
        adminUser:
          adminEmail && adminPassword
            ? { email: adminEmail, password: adminPassword }
            : undefined,
      }),
    });

    setCompanyName("");
    setLocName("");
    setLocAddress("");
    setAdminEmail("");
    setAdminPassword("");
    setCreating(false);
    setOpen(false);
    fetchCompanies();
  }

  return (
    <motion.div variants={pageTransition} initial="hidden" animate="visible">
      <PageHeader
        title="Companies"
        description="Onboard and manage dealerships"
      >
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus size={14} />
              New Company
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
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

              <div className="border-t pt-4">
                <p className="text-body-sm font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
                  <MapPin size={14} /> First Location (optional)
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={locName}
                      onChange={(e) => setLocName(e.target.value)}
                      placeholder="Main Garage"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input
                      value={locAddress}
                      onChange={(e) => setLocAddress(e.target.value)}
                      placeholder="123 Main St"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
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
                {creating && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Company
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <motion.div variants={staggerItem}>
        <Card>
          <CardContent className="p-4">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-12 bg-muted rounded animate-pulse"
                  />
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
                    <TableHead className="text-center">Locations</TableHead>
                    <TableHead className="text-center">Users</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Created
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium flex items-center gap-2">
                        <Building2
                          size={14}
                          className="text-muted-foreground"
                        />
                        {c.name}
                      </TableCell>
                      <TableCell className="text-center">
                        {c.locationCount}
                      </TableCell>
                      <TableCell className="text-center">
                        {c.userCount}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {formatDateShort(c.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
