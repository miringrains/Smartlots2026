"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Users, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { pageTransition, staggerItem } from "@/lib/motion";
import { createClient } from "@/lib/supabase/client";
import { useCompany } from "@/lib/company-context";
import { formatDateShort } from "@/lib/utils";
import type { UserDTO } from "@/lib/dto";

interface LocationOption {
  id: string;
  name: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [currentUser, setCurrentUser] = useState<{ userType: string; companyId: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("USER");
  const [newLocationId, setNewLocationId] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const { selectedCompany, ready } = useCompany();

  const fetchData = useCallback(async () => {
    if (!ready || !selectedCompany) return;

    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    const { data: me } = await supabase
      .from("users")
      .select("user_type, company_id, location_id")
      .eq("id", session.user.id)
      .single();

    if (me) {
      setCurrentUser({ userType: me.user_type, companyId: me.company_id });
      setNewLocationId(me.location_id || "");
    }

    const { data: usersData } = await supabase
      .from("users")
      .select("*, locations(*)")
      .eq("company_id", selectedCompany.id)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    if (usersData) {
      setUsers(
        usersData.map((u) => ({
          id: u.id,
          email: u.email,
          userType: u.user_type,
          locationId: u.location_id,
          companyId: u.company_id,
          createdAt: u.created_at,
          isFirstLogin: u.is_first_login,
          requiresPasswordChange: u.requires_password_change,
          location: u.locations
            ? {
                id: u.locations.id,
                name: u.locations.name,
                address: u.locations.address,
              }
            : null,
        }))
      );
    }

    const { data: locData } = await supabase
      .from("locations")
      .select("id, name")
      .eq("company_id", selectedCompany.id)
      .eq("is_deleted", false)
      .order("name");

    if (locData) {
      setLocations(locData);
    }

    setLoading(false);
  }, [ready, selectedCompany]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function createUser() {
    if (!newEmail || !newPassword) return;
    setCreating(true);
    setErrorMsg("");

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setCreating(false);
        return;
      }

      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          userType: newRole,
          locationId: newLocationId || undefined,
          companyId: selectedCompany?.id,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setErrorMsg(err.error || "Failed to create user");
        setCreating(false);
        return;
      }

      setNewEmail("");
      setNewPassword("");
      setNewRole("USER");
      setNewLocationId(currentUser?.companyId ? "" : "");
      setOpen(false);
      fetchData();
    } catch (e) {
      console.error(e);
      setErrorMsg("Unexpected error");
    }
    setCreating(false);
  }

  const isSuperAdmin = currentUser?.userType === "SUPER_ADMIN";

  return (
    <motion.div variants={pageTransition} initial="hidden" animate="visible">
      <PageHeader title="Users" description="Manage user accounts and roles">
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); setErrorMsg(""); }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus size={14} />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="user@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Temporary password"
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">Attendant</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    {isSuperAdmin && (
                      <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Select value={newLocationId} onValueChange={setNewLocationId}>
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
              {errorMsg && (
                <p className="text-sm text-destructive">{errorMsg}</p>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button
                onClick={createUser}
                disabled={creating || !newEmail || !newPassword}
              >
                {creating && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create User
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
            ) : users.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No users"
                description="Add your first team member"
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Location
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      Joined
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.email}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={user.userType} />
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {user.location?.name || "\u2014"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {formatDateShort(user.createdAt)}
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
