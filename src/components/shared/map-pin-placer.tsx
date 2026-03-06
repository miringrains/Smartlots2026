"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export interface PlacerPin {
  lat: number;
  lng: number;
  label?: string;
  id?: string;
}

interface Props {
  center: { lat: number; lng: number };
  existingPins?: PlacerPin[];
  activePin?: { lat: number; lng: number } | null;
  highlightId?: string | null;
  placementMode?: boolean;
  onPinPlace?: (lat: number, lng: number) => void;
  onPinClick?: (id: string) => void;
  zoom?: number;
  className?: string;
}

export function MapPinPlacer({
  center,
  existingPins = [],
  activePin = null,
  highlightId = null,
  placementMode = false,
  onPinPlace,
  onPinClick,
  zoom = 16,
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const existingMarkersRef = useRef<any[]>([]);
  const activePinMarkerRef = useRef<any>(null);
  const dealerMarkerRef = useRef<any>(null);
  const mapboxRef = useRef<any>(null);

  const onPinPlaceRef = useRef(onPinPlace);
  onPinPlaceRef.current = onPinPlace;
  const onPinClickRef = useRef(onPinClick);
  onPinClickRef.current = onPinClick;
  const placementModeRef = useRef(placementMode);
  placementModeRef.current = placementMode;

  useEffect(() => {
    if (!containerRef.current || !MAPBOX_TOKEN) return;
    let cancelled = false;

    async function init() {
      const mapboxgl = (await import("mapbox-gl")).default;
      if (cancelled || !containerRef.current) return;

      mapboxRef.current = mapboxgl;
      (mapboxgl as any).accessToken = MAPBOX_TOKEN;

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center: [center.lng, center.lat],
        zoom,
        interactive: true,
        attributionControl: false,
        logoPosition: "bottom-right",
      });

      mapRef.current = map;

      map.on("load", () => {
        if (cancelled) return;
        setReady(true);
      });

      map.on("click", (e: any) => {
        if (!placementModeRef.current) return;
        onPinPlaceRef.current?.(e.lngLat.lat, e.lngLat.lng);
      });
    }

    init();

    return () => {
      cancelled = true;
      existingMarkersRef.current.forEach((m) => m.remove());
      existingMarkersRef.current = [];
      activePinMarkerRef.current?.remove();
      dealerMarkerRef.current?.remove();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [center.lat, center.lng, zoom]);

  useEffect(() => {
    if (!mapRef.current || !containerRef.current) return;
    const canvas = mapRef.current.getCanvasContainer();
    if (placementMode) {
      canvas.style.cursor = "crosshair";
    } else {
      canvas.style.cursor = "";
    }
  }, [placementMode, ready]);

  const syncExistingPins = useCallback(() => {
    const map = mapRef.current;
    const mapboxgl = mapboxRef.current;
    if (!map || !mapboxgl || !ready) return;

    existingMarkersRef.current.forEach((m) => m.remove());
    existingMarkersRef.current = [];

    existingPins.forEach((pin) => {
      const isHighlighted = highlightId != null && pin.id === highlightId;
      const el = document.createElement("div");
      el.style.cssText = `
        width: 24px; height: 24px;
        border-radius: 50% 50% 50% 0;
        background: ${isHighlighted ? "#ee3f43" : "rgba(255,255,255,0.85)"};
        transform: rotate(-45deg);
        border: 2px solid ${isHighlighted ? "#fff" : "rgba(255,255,255,0.4)"};
        box-shadow: 0 2px 8px rgba(0,0,0,0.35);
        cursor: pointer;
        transition: all 0.2s ease;
        ${isHighlighted ? "z-index:10;" : ""}
      `;
      el.addEventListener("mouseenter", () => {
        el.style.transform = "rotate(-45deg) scale(1.2)";
      });
      el.addEventListener("mouseleave", () => {
        el.style.transform = "rotate(-45deg) scale(1)";
      });
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        if (pin.id) onPinClickRef.current?.(pin.id);
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([pin.lng, pin.lat])
        .addTo(map);

      if (pin.label) {
        marker.setPopup(
          new mapboxgl.Popup({
            offset: 18,
            closeButton: false,
            className: "smartlots-popup",
          }).setHTML(
            `<div style="font-size:12px;font-weight:600;color:#fff;padding:2px 4px;">${pin.label}</div>`
          )
        );
      }

      existingMarkersRef.current.push(marker);
    });
  }, [existingPins, highlightId, ready]);

  useEffect(() => {
    syncExistingPins();
  }, [syncExistingPins]);

  useEffect(() => {
    const map = mapRef.current;
    const mapboxgl = mapboxRef.current;
    if (!map || !mapboxgl || !ready) return;

    dealerMarkerRef.current?.remove();

    const el = document.createElement("div");
    el.style.cssText = `
      width: 18px; height: 18px;
      border-radius: 50%;
      background: #ee3f43;
      border: 3px solid #fff;
      box-shadow: 0 0 0 3px rgba(238,63,67,0.25), 0 2px 8px rgba(0,0,0,0.3);
      pointer-events: none;
    `;

    dealerMarkerRef.current = new mapboxgl.Marker({ element: el })
      .setLngLat([center.lng, center.lat])
      .addTo(map);
  }, [center.lat, center.lng, ready]);

  useEffect(() => {
    const map = mapRef.current;
    const mapboxgl = mapboxRef.current;
    if (!map || !mapboxgl || !ready) return;

    activePinMarkerRef.current?.remove();
    activePinMarkerRef.current = null;

    if (!activePin) return;

    const el = document.createElement("div");
    el.innerHTML = `
      <div style="position:relative;width:36px;height:36px;">
        <div style="
          position:absolute; inset:0;
          border-radius:50% 50% 50% 0;
          background:#ee3f43;
          transform:rotate(-45deg);
          border:2.5px solid #fff;
          box-shadow: 0 0 0 4px rgba(238,63,67,0.2), 0 3px 12px rgba(0,0,0,0.4);
          animation: smartlots-pin-pulse 1.5s ease-in-out infinite;
        "></div>
        <div style="
          position:absolute; top:50%; left:50%;
          transform:translate(-50%,-50%) rotate(0deg);
          width:8px; height:8px;
          border-radius:50%;
          background:#fff;
        "></div>
      </div>
    `;

    const marker = new mapboxgl.Marker({
      element: el,
      draggable: true,
    })
      .setLngLat([activePin.lng, activePin.lat])
      .addTo(map);

    marker.on("dragend", () => {
      const lngLat = marker.getLngLat();
      onPinPlaceRef.current?.(lngLat.lat, lngLat.lng);
    });

    activePinMarkerRef.current = marker;
  }, [activePin?.lat, activePin?.lng, ready]);

  if (!MAPBOX_TOKEN) {
    return (
      <div
        className={cn(
          "rounded-xl bg-muted/30 border border-border/50 flex items-center justify-center text-muted-foreground text-body-sm",
          className
        )}
      >
        Map unavailable — Mapbox token not set
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

      <style jsx global>{`
        @keyframes smartlots-pin-pulse {
          0%, 100% { box-shadow: 0 0 0 4px rgba(238,63,67,0.2), 0 3px 12px rgba(0,0,0,0.4); }
          50% { box-shadow: 0 0 0 8px rgba(238,63,67,0.1), 0 3px 12px rgba(0,0,0,0.4); }
        }
        .mapboxgl-ctrl-logo,
        .mapboxgl-ctrl-attrib {
          display: none !important;
        }
      `}</style>
    </div>
  );
}

export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<string> {
  if (!MAPBOX_TOKEN) return "";
  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&types=address&limit=1`
    );
    const json = await res.json();
    return json.features?.[0]?.place_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}
