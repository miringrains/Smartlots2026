"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, Plus, Download, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import type { TicketDTO } from "@/lib/dto";

export default function TicketsPage() {
  const [tickets, setTickets] = useState<TicketDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchTickets = useCallback(async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const headers = { Authorization: `Bearer ${session.access_token}` };
    let url = "/api/tickets";

    if (search) {
      url = `/api/tickets/search?vin=${encodeURIComponent(search)}&licensePlate=${encodeURIComponent(search)}`;
    }

    const res = await fetch(url, { headers });
    const data = await res.json();
    setTickets(data.data || []);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const filtered = statusFilter === "all"
    ? tickets
    : tickets.filter((t) => t.ticketState === statusFilter);

  const exportCSV = () => {
    const headers = ["VIN", "Make", "Model", "Year", "License Plate", "Status", "Created"];
    const rows = filtered.map((t) => [t.vin, t.make, t.model, t.year, t.licensePlate, t.ticketState, t.createdAt]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tickets.csv";
    a.click();
  };

  return (
    <motion.div variants={pageTransition} initial="hidden" animate="visible">
      <PageHeader title="Tickets" description="Manage vehicle service tickets">
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download size={14} />
          Export
        </Button>
      </PageHeader>

      <motion.div variants={staggerItem}>
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  placeholder="Search by VIN or license plate..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="DOCUMENTED">Documented</SelectItem>
                  <SelectItem value="SERVICING">Servicing</SelectItem>
                  <SelectItem value="READY">Ready</SelectItem>
                  <SelectItem value="DELIVERED">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={Search}
                title="No tickets found"
                description="Try adjusting your search or filter criteria"
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle</TableHead>
                    <TableHead className="hidden sm:table-cell">VIN</TableHead>
                    <TableHead className="hidden md:table-cell">License Plate</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Created</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{ticket.year} {ticket.make} {ticket.model}</p>
                          <p className="text-caption text-muted-foreground sm:hidden">{ticket.licensePlate}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-body-sm text-muted-foreground font-mono">
                        {ticket.vin?.slice(-8)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{ticket.licensePlate}</TableCell>
                      <TableCell>
                        <StatusBadge status={ticket.ticketState} />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-body-sm text-muted-foreground">
                        {formatDateShort(ticket.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Link href={`/tickets/${ticket.id}`}>
                          <Button variant="ghost" size="icon-xs">
                            <Eye size={14} />
                          </Button>
                        </Link>
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
