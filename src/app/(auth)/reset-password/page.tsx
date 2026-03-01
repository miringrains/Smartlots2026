"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const schema = z.object({
  email: z.string().email(),
  code: z.string().min(1, "Reset code is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

export default function ResetPasswordPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: "", code: "", newPassword: "" },
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Failed to reset password");
      setLoading(false);
      return;
    }

    router.push("/login");
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-heading-1">Set new password</h1>
        <p className="mt-1 text-body-sm text-muted-foreground">
          Enter the code from your email and your new password
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-body-sm text-destructive">
          {error}
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reset code</FormLabel>
                <FormControl>
                  <Input placeholder="Enter code from email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Min 6 characters" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Reset password
          </Button>
        </form>
      </Form>
    </div>
  );
}
