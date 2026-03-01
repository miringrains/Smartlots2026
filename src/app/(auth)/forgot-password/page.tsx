"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2 } from "lucide-react";
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
  email: z.string().email("Enter a valid email"),
});

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    setLoading(true);
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: values.email }),
    });
    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="text-center">
        <h1 className="text-heading-1 mb-2">Check your email</h1>
        <p className="text-body-sm text-muted-foreground mb-6">
          We sent a password reset code to your email address.
        </p>
        <Link href="/login">
          <Button variant="outline" className="gap-2">
            <ArrowLeft size={14} />
            Back to sign in
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-heading-1">Reset password</h1>
        <p className="mt-1 text-body-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a reset code
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="your@email.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send reset code
          </Button>
        </form>
      </Form>

      <div className="mt-4 text-center">
        <Link
          href="/login"
          className="text-body-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
        >
          <ArrowLeft size={12} />
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
