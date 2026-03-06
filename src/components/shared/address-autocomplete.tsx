"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { MapPin, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface AddressResult {
  address: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
  fullText: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSelect: (result: AddressResult) => void;
  placeholder?: string;
  className?: string;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Start typing an address…",
  className,
}: Props) {
  const [suggestions, setSuggestions] = useState<AddressResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const inputWrapperRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const search = useCallback(async (query: string) => {
    if (!query || query.length < 2 || !MAPBOX_TOKEN) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    setLoading(true);
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        query
      )}.json?access_token=${MAPBOX_TOKEN}&country=us&types=address&limit=5&autocomplete=true`;

      const res = await fetch(url);
      const json = await res.json();

      const results: AddressResult[] = (json.features || []).map(
        (f: any) => {
          const ctx = (f.context || []) as { id: string; text: string }[];
          const city =
            ctx.find((c) => c.id.startsWith("place"))?.text || "";
          const state =
            ctx.find((c) => c.id.startsWith("region"))?.text || "";
          const zip =
            ctx.find((c) => c.id.startsWith("postcode"))?.text || "";
          const [lng, lat] = f.center as [number, number];

          return {
            address: f.place_name as string,
            city,
            state,
            zip,
            lat,
            lng,
            fullText: f.place_name as string,
          };
        }
      );

      setSuggestions(results);
      if (results.length > 0) {
        setOpen(true);
        updateDropdownPosition();
      } else {
        setOpen(false);
      }
      setHighlightIdx(-1);
    } catch {
      setSuggestions([]);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }, []);

  function updateDropdownPosition() {
    if (!inputWrapperRef.current) return;
    const rect = inputWrapperRef.current.getBoundingClientRect();
    setDropdownPos({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 180);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, search]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        inputWrapperRef.current &&
        !inputWrapperRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;
    function handleScroll() {
      updateDropdownPosition();
    }
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
    };
  }, [open]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && highlightIdx >= 0) {
      e.preventDefault();
      pickSuggestion(suggestions[highlightIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  function pickSuggestion(result: AddressResult) {
    onChange(result.fullText);
    onSelect(result);
    setOpen(false);
    setSuggestions([]);
  }

  const dropdown =
    open && suggestions.length > 0
      ? createPortal(
          <div
            ref={dropdownRef}
            className="fixed rounded-lg border border-border bg-popover shadow-lg overflow-hidden"
            style={{
              top: dropdownPos.top,
              left: dropdownPos.left,
              width: dropdownPos.width,
              zIndex: 9999,
            }}
          >
            {suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => pickSuggestion(s)}
                className={cn(
                  "flex items-start gap-2.5 w-full px-3 py-2.5 text-left text-body-sm transition-colors",
                  i === highlightIdx
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-muted/50"
                )}
              >
                <MapPin
                  size={13}
                  className="mt-0.5 shrink-0 text-primary"
                />
                <span className="line-clamp-2">{s.fullText}</span>
              </button>
            ))}
            <div className="px-3 py-1.5 text-[10px] text-muted-foreground/60 border-t border-border/50">
              Powered by Mapbox
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div className={cn("relative", className)}>
      <div ref={inputWrapperRef} className="relative">
        <MapPin
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              updateDropdownPosition();
              setOpen(true);
            }
          }}
          placeholder={placeholder}
          className="pl-9 pr-8"
        />
        {loading && (
          <Loader2
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground"
          />
        )}
        {!loading && value && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setSuggestions([]);
              setOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>
      {dropdown}
    </div>
  );
}
