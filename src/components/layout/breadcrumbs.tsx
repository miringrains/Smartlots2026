"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { Fragment } from "react";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function formatSegment(segment: string) {
  return segment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const filtered = segments.filter((s) => !UUID_REGEX.test(s));

  return (
    <nav className="flex items-center gap-1 text-body-sm text-muted-foreground">
      <Link href="/dashboard" className="hover:text-foreground transition-colors">
        <Home size={14} />
      </Link>
      {filtered.map((segment, index) => {
        const href = "/" + filtered.slice(0, index + 1).join("/");
        const isLast = index === filtered.length - 1;
        return (
          <Fragment key={href}>
            <ChevronRight size={12} className="text-muted-foreground/50" />
            {isLast ? (
              <span className="text-foreground font-medium max-w-[160px] sm:max-w-[200px] truncate">
                {formatSegment(segment)}
              </span>
            ) : (
              <Link
                href={href}
                className={`hover:text-foreground transition-colors hidden sm:flex`}
              >
                {formatSegment(segment)}
              </Link>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
