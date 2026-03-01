"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/shared/page-header";
import { pageTransition, staggerItem } from "@/lib/motion";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function SettingsPage() {
  const [companyName, setCompanyName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserEmail(user.email || "");

      const { data: profile } = await supabase
        .from("users")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (profile?.company_id) {
        const { data: company } = await supabase
          .from("companies")
          .select("name")
          .eq("id", profile.company_id)
          .single();
        if (company) setCompanyName(company.name);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  async function saveCompany() {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("users")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (profile?.company_id) {
      await supabase
        .from("companies")
        .update({ name: companyName })
        .eq("id", profile.company_id);
      toast.success("Company name updated");
    }
    setSaving(false);
  }

  if (loading) {
    return <div className="h-64 bg-muted rounded-xl animate-pulse" />;
  }

  return (
    <motion.div variants={pageTransition} initial="hidden" animate="visible">
      <PageHeader title="Settings" description="Manage company and account settings" />

      <div className="max-w-2xl space-y-6">
        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader>
              <CardTitle>Branding</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-6">
              <div className="rounded-xl border bg-white p-4">
                <Image src="/logo.webp" alt="Logo" width={120} height={32} />
              </div>
              <div className="rounded-xl border bg-neutral-900 p-4">
                <Image src="/logo-white.webp" alt="Logo (dark)" width={120} height={32} />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader>
              <CardTitle>Company Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
              <Button onClick={saveCompany} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={userEmail} disabled />
              </div>
              <Separator />
              <p className="text-caption text-muted-foreground">
                Contact your administrator to change your email address or reset your password.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
