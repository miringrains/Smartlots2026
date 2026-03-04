import { headers } from "next/headers";
import { redirect } from "next/navigation";

const MARKETING_HOSTS = [
  "smartlotpro.com",
  "www.smartlotpro.com",
];

export default async function RootPage() {
  const headersList = await headers();
  const host = headersList.get("host") ?? "";
  const hostname = host.split(":")[0];

  if (MARKETING_HOSTS.includes(hostname)) {
    redirect("/home");
  }

  redirect("/dashboard");
}
