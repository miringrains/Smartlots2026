"use client";

import { useEffect, useState } from "react";
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
import { formatDateShort } from "@/lib/utils";
import type { UserDTO } from "@/lib/dto";

export default function UsersPage() {
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("USER");

  async function fetchUsers() {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from("users")
      .select("*, locations(*)")
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    if (data) {
      setUsers(
        data.map((u) => ({
          id: u.id,
          email: u.email,
          userType: u.user_type,
          locationId: u.location_id,
          companyId: u.company_id,
          createdAt: u.created_at,
          isFirstLogin: u.is_first_login,
          requiresPasswordChange: u.requires_password_change,
          location: u.locations ? { id: u.locations.id, name: u.locations.name, address: u.locations.address } : null,
        }))
      );
    }
    setLoading(false);
  }

  useEffect(() => { fetchUsers(); }, []);

  async function createUser() {
    if (!newEmail || !newPassword) return;
    setCreating(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail, password: newPassword, userType: newRole }),
      });

      if (!res.ok) {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const adminRes = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users`,
          {
            method: "POST",
            headers: {
              apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
              Authorization: `Bearer ${session.access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: newEmail,
              password: newPassword,
              email_confirm: true,
            }),
          }
        );

        if (adminRes.ok) {
          const userData = await adminRes.json();
          const { data: profile } = await supabase.from("users").select("*").eq("id", userData.id).single();
          if (!profile) {
            const currentUser = users[0];
            await supabase.from("users").insert({
              id: userData.id,
              email: newEmail,
              user_type: newRole,
              company_id: currentUser?.companyId,
              location_id: currentUser?.locationId,
            });
          }
        }
      }
    } catch (e) {
      console.error(e);
    }

    setNewEmail("");
    setNewPassword("");
    setNewRole("USER");
    setCreating(false);
    fetchUsers();
  }

  return (
    <motion.div variants={pageTransition} initial="hidden" animate="visible">
      <PageHeader title="Users" description="Manage user accounts and roles">
        <Dialog>
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
                    <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={createUser} disabled={creating || !newEmail || !newPassword}>
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
                  <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : users.length === 0 ? (
              <EmptyState icon={Users} title="No users" description="Add your first team member" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="hidden sm:table-cell">Location</TableHead>
                    <TableHead className="hidden md:table-cell">Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>
                        <StatusBadge status={user.userType} />
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {user.location?.name || "—"}
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
