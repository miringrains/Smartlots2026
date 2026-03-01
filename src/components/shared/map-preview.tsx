"use client";

import { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export interface MapPin {
  lat: number;
  lng: number;
  label?: string;
  color?: string;
}

interface Props {
  pins: MapPin[];
  zoom?: number;
  className?: string;
  interactive?: boolean;
}

export function MapPreview({
  pins,
  zoom = 14,
  className,
  interactive = false,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!containerRef.current || !MAPBOX_TOKEN || pins.length === 0) return;

    let cancelled = false;

    async function init() {
      const mapboxgl = (await import("mapbox-gl")).default;

      if (cancelled || !containerRef.current) return;

      (mapboxgl as any).accessToken = MAPBOX_TOKEN;

      const center =
        pins.length === 1
          ? [pins[0].lng, pins[0].lat]
          : [
              pins.reduce((s, p) => s + p.lng, 0) / pins.length,
              pins.reduce((s, p) => s + p.lat, 0) / pins.length,
            ];

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center: center as [number, number],
        zoom,
        interactive,
        attributionControl: false,
        logoPosition: "bottom-right",
      });

      mapRef.current = map;

      map.on("load", () => {
        if (cancelled) return;
        setReady(true);

        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];

        pins.forEach((pin) => {
          const el = document.createElement("div");
          el.className = "smartlots-map-marker";
          el.style.cssText = `
            width: 28px;
            height: 28px;
            border-radius: 50% 50% 50% 0;
            background: ${pin.color || "#ee3f43"};
            transform: rotate(-45deg);
            border: 2px solid rgba(255,255,255,0.9);
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            cursor: pointer;
            transition: transform 0.15s ease;
          `;
          el.addEventListener("mouseenter", () => {
            el.style.transform = "rotate(-45deg) scale(1.15)";
          });
          el.addEventListener("mouseleave", () => {
            el.style.transform = "rotate(-45deg) scale(1)";
          });

          const marker = new mapboxgl.Marker({ element: el })
            .setLngLat([pin.lng, pin.lat])
            .addTo(map);

          if (pin.label) {
            const popup = new mapboxgl.Popup({
              offset: 20,
              closeButton: false,
              className: "smartlots-popup",
            }).setHTML(
              `<div style="font-size:13px;font-weight:600;color:#fff;padding:2px 4px;">${pin.label}</div>`
            );
            marker.setPopup(popup);
          }

          markersRef.current.push(marker);
        });

        if (pins.length > 1) {
          const bounds = new mapboxgl.LngLatBounds();
          pins.forEach((p) => bounds.extend([p.lng, p.lat]));
          map.fitBounds(bounds, { padding: 50, maxZoom: 16 });
        }
      });
    }

    init();

    return () => {
      cancelled = true;
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [pins, zoom, interactive]);

  if (!MAPBOX_TOKEN || pins.length === 0) {
    return (
      <div
        className={cn(
          "rounded-xl bg-muted/30 border border-border/50 flex items-center justify-center text-muted-foreground text-body-sm",
          className
        )}
      >
        No location data
      </div>
    );
  }

  return (
    <div className={cn("relative rounded-xl overflow-hidden border border-border/50", className)}>
      <div ref={containerRef} className="w-full h-full" />
      {!ready && (
        <div className="absolute inset-0 bg-muted/50 flex items-center justify-center">
          <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
