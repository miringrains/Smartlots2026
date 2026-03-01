"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Users,
  Loader2,
  Search,
  MoreHorizontal,
  ShieldAlert,
  ShieldCheck,
  KeyRound,
  UserCog,
  MapPin,
  Trash2,
  UserX,
  UserCheck,
} from "lucide-react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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

type ConfirmAction = {
  type: "delete" | "suspend" | "unsuspend" | "resetPassword";
  user: UserDTO;
} | null;

type EditAction = {
  type: "changeRole" | "changeLocation";
  user: UserDTO;
} | null;

export default function UsersPage() {
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    userType: string;
    companyId: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("USER");
  const [newLocationId, setNewLocationId] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [editAction, setEditAction] = useState<EditAction>(null);
  const [editValue, setEditValue] = useState("");

  const { selectedCompany, ready } = useCompany();

  async function getSession() {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  }

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
      setCurrentUser({
        id: session.user.id,
        userType: me.user_type,
        companyId: me.company_id,
      });
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
          isSuspended: u.is_suspended ?? false,
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

    if (locData) setLocations(locData);
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
      const session = await getSession();
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
      setNewLocationId("");
      setOpen(false);
      fetchData();
    } catch {
      setErrorMsg("Unexpected error");
    }
    setCreating(false);
  }

  async function executeAction(action: string, userId: string, extra?: Record<string, string>) {
    setActionLoading(true);
    try {
      const session = await getSession();
      if (!session) return;

      if (action === "delete") {
        await fetch(`/api/admin/users?userId=${userId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
      } else {
        await fetch("/api/admin/users", {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId, action, ...extra }),
        });
      }
      fetchData();
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
      setEditAction(null);
      setEditValue("");
    }
  }

  const isSuperAdmin = currentUser?.userType === "SUPER_ADMIN";
  const isAdmin =
    currentUser?.userType === "ADMIN" || currentUser?.userType === "SUPER_ADMIN";

  const filtered = users.filter((u) => {
    const matchesSearch =
      !searchQuery ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || u.userType === roleFilter;
    return matchesSearch && matchesRole;
  });

  const stats = {
    total: users.length,
    admins: users.filter((u) => u.userType === "ADMIN").length,
    attendants: users.filter((u) => u.userType === "USER").length,
    suspended: users.filter((u) => u.isSuspended).length,
  };

  const confirmMessages: Record<string, { title: string; desc: (email: string) => string; actionLabel: string }> = {
    delete: {
      title: "Delete User",
      desc: (e) => `This will permanently deactivate ${e}. They will lose access immediately. This cannot be undone.`,
      actionLabel: "Delete User",
    },
    suspend: {
      title: "Suspend User",
      desc: (e) => `${e} will be locked out immediately and unable to log in until unsuspended.`,
      actionLabel: "Suspend",
    },
    unsuspend: {
      title: "Unsuspend User",
      desc: (e) => `${e} will regain access and be able to log in again.`,
      actionLabel: "Unsuspend",
    },
    resetPassword: {
      title: "Reset Password",
      desc: (e) => `A password reset email will be sent to ${e}.`,
      actionLabel: "Send Reset Email",
    },
  };

  return (
    <motion.div variants={pageTransition} initial="hidden" animate="visible">
      <PageHeader title="Users" description="Manage user accounts and roles">
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            setErrorMsg("");
          }}
        >
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
              <div className="grid gap-4 sm:grid-cols-2">
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
                        <SelectItem value="SUPER_ADMIN">
                          Super Admin
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
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

      {/* Stats strip */}
      {!loading && users.length > 0 && (
        <motion.div
          variants={staggerItem}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6"
        >
          {[
            { label: "Total", value: stats.total, icon: Users },
            { label: "Admins", value: stats.admins, icon: ShieldCheck },
            { label: "Attendants", value: stats.attendants, icon: UserCheck },
            { label: "Suspended", value: stats.suspended, icon: UserX },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-lg bg-muted p-2 text-muted-foreground">
                  <s.icon size={16} strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-display-sm leading-none">{s.value}</p>
                  <p className="text-caption text-muted-foreground">
                    {s.label}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      )}

      <motion.div variants={staggerItem}>
        <Card>
          <CardContent className="p-4">
            {/* Search + filter bar */}
            {!loading && users.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    placeholder="Search by email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="All roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All roles</SelectItem>
                    <SelectItem value="USER">Attendants</SelectItem>
                    <SelectItem value="ADMIN">Admins</SelectItem>
                    {isSuperAdmin && (
                      <SelectItem value="SUPER_ADMIN">Super Admins</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-14 bg-muted rounded animate-pulse"
                  />
                ))}
              </div>
            ) : filtered.length === 0 && users.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No users"
                description="Add your first team member"
              />
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={Search}
                title="No matches"
                description="Try adjusting your search or filter"
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Location
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      Status
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Joined
                    </TableHead>
                    {isAdmin && <TableHead className="w-10" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((u) => {
                    const isSelf = u.id === currentUser?.id;
                    return (
                      <TableRow
                        key={u.id}
                        className={u.isSuspended ? "opacity-60" : ""}
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium text-body-sm">
                              {u.email}
                            </p>
                            <p className="text-caption text-muted-foreground sm:hidden">
                              {u.location?.name || "\u2014"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={u.userType} />
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground text-body-sm">
                          {u.location?.name || "\u2014"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {u.isSuspended ? (
                            <Badge variant="warning">Suspended</Badge>
                          ) : (
                            <Badge variant="success">Active</Badge>
                          )}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground text-body-sm">
                          {formatDateShort(u.createdAt)}
                        </TableCell>
                        {isAdmin && (
                          <TableCell>
                            {!isSelf && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    className="h-8 w-8"
                                  >
                                    <MoreHorizontal size={14} />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() =>
                                      setEditAction({
                                        type: "changeRole",
                                        user: u,
                                      })
                                    }
                                  >
                                    <UserCog size={14} />
                                    Change Role
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      setEditAction({
                                        type: "changeLocation",
                                        user: u,
                                      })
                                    }
                                  >
                                    <MapPin size={14} />
                                    Change Location
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      setConfirmAction({
                                        type: "resetPassword",
                                        user: u,
                                      })
                                    }
                                  >
                                    <KeyRound size={14} />
                                    Reset Password
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  {u.isSuspended ? (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        setConfirmAction({
                                          type: "unsuspend",
                                          user: u,
                                        })
                                      }
                                    >
                                      <ShieldCheck size={14} />
                                      Unsuspend
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem
                                      className="text-warning focus:text-warning"
                                      onClick={() =>
                                        setConfirmAction({
                                          type: "suspend",
                                          user: u,
                                        })
                                      }
                                    >
                                      <ShieldAlert size={14} />
                                      Suspend
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() =>
                                      setConfirmAction({
                                        type: "delete",
                                        user: u,
                                      })
                                    }
                                  >
                                    <Trash2 size={14} />
                                    Delete User
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Confirm dialog for destructive / simple actions */}
      <AlertDialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        {confirmAction && (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {confirmMessages[confirmAction.type].title}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {confirmMessages[confirmAction.type].desc(
                  confirmAction.user.email
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={actionLoading}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={actionLoading}
                className={
                  confirmAction.type === "delete"
                    ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    : confirmAction.type === "suspend"
                    ? "bg-warning text-warning-foreground hover:bg-warning/90"
                    : ""
                }
                onClick={() =>
                  executeAction(confirmAction.type, confirmAction.user.id)
                }
              >
                {actionLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {confirmMessages[confirmAction.type].actionLabel}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>

      {/* Edit dialog for changeRole / changeLocation */}
      <Dialog
        open={!!editAction}
        onOpenChange={(open) => {
          if (!open) {
            setEditAction(null);
            setEditValue("");
          }
        }}
      >
        {editAction && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editAction.type === "changeRole"
                  ? "Change Role"
                  : "Change Location"}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-3">
              <p className="text-body-sm text-muted-foreground">
                Updating <span className="font-medium text-foreground">{editAction.user.email}</span>
              </p>
              {editAction.type === "changeRole" ? (
                <Select value={editValue} onValueChange={setEditValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select new role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">Attendant</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    {isSuperAdmin && (
                      <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              ) : (
                <Select value={editValue} onValueChange={setEditValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select new location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button
                disabled={!editValue || actionLoading}
                onClick={() =>
                  executeAction(editAction.type, editAction.user.id, {
                    [editAction.type === "changeRole"
                      ? "userType"
                      : "locationId"]: editValue,
                  })
                }
              >
                {actionLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </motion.div>
  );
}
