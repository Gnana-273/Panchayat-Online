/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  MapPin,
  Info,
  Layers,
  ZoomIn,
  Eye,
  Activity,
  Search,
  Compass,
  Sliders,
  Globe,
  Flame,
  Navigation,
  AlertTriangle,
  Construction,
  Droplet,
  Lightbulb,
  Trash2,
  Wrench,
} from "lucide-react";
import { CommunityIssue, IssueCategory } from "../types";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
} from "@vis.gl/react-google-maps";
import { useToast } from "../context/ToastContext";
import { useLiveLocation } from "../hooks/useLiveLocation";
import ConfirmationModal from "./ConfirmationModal";

interface MapViewProps {
  issues: CommunityIssue[];
  selectedIssue: CommunityIssue | null;
  onSelectIssue: (issue: CommunityIssue) => void;
  onSelectWard: (ward: string | null) => void;
  selectedWard: string | null;
  onAddIssues?: (newIssues: CommunityIssue[]) => void;
  onReportFromLocation?: (location: {
    address: string;
    ward: string;
    lat: number;
    lng: number;
  }) => void;
}

// Bounding box for coordinate mapping on simulated SVG
const LAT_MIN = 17.42;
const LAT_MAX = 17.45;
const LNG_MIN = 78.43;
const LNG_MAX = 78.47;

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  "";

const hasValidKey =
  Boolean(API_KEY) && API_KEY !== "YOUR_API_KEY" && API_KEY.trim() !== "";

export default function MapView({
  issues,
  selectedIssue,
  onSelectIssue,
  onSelectWard,
  selectedWard,
  onAddIssues,
  onReportFromLocation,
}: MapViewProps) {
  const { showToast } = useToast();
  const { getLiveLocation } = useLiveLocation();

  // Map settings and engines
  const [useRealMap, setUseRealMap] = useState<boolean>(true); // default to true if we want real map
  const [mapMode, setMapMode] = useState<"street" | "satellite">("street");
  const [hoveredWard, setHoveredWard] = useState<string | null>(null);
  const [hoverCoords, setHoverCoords] = useState({
    lat: 17.4352,
    lng: 78.4485,
  });

  // Live geolocation state
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: 17.4352,
    lng: 78.4485,
  });
  const [mapZoom, setMapZoom] = useState<number>(14);
  const [permissionStatus, setPermissionStatus] = useState<
    "prompt" | "granted" | "denied" | "loading"
  >("prompt");
  const [isMaximized, setIsMaximized] = useState<boolean>(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsMaximized(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Confirmation modal state
  const [confirmLocation, setConfirmLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // Center map on selected issue if it changes
  useEffect(() => {
    if (selectedIssue && useRealMap && hasValidKey) {
      setMapCenter({
        lat: selectedIssue.location.lat,
        lng: selectedIssue.location.lng,
      });
      setMapZoom(16);
    }
  }, [selectedIssue, useRealMap]);

  // Request user's live location and center on them using useLiveLocation hook
  const handleLocateUser = () => {
    setPermissionStatus("loading");
    showToast("Requesting location permission...", "info");

    getLiveLocation(
      async (coords) => {
        const { lat: latitude, lng: longitude } = coords;
        setUserLocation(coords);
        setMapCenter(coords);
        setMapZoom(15);
        setPermissionStatus("granted");
        showToast(
          "GPS Live Location acquired successfully! Centered map.",
          "success",
        );
        setConfirmLocation(coords);

        // Sync with backend to seed/retrieve nearby issues around user's GPS coordinates
        try {
          const res = await fetch("/api/issues/seed-nearby", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lat: latitude, lng: longitude }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.seeded && onAddIssues) {
              onAddIssues(data.issues);
            }
          }
        } catch (err) {
          console.error("Failed to seed nearby issues:", err);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setPermissionStatus("denied");
        let errorMsg = "Could not fetch live location.";
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg =
            "Location permission denied. Please allow location access in your browser settings.";
        }
        showToast(errorMsg, "error");
      },
    );
  };

  // Helper to retrieve nearby reports from the current state (within ~15km range of the map center)
  const getNearbyReports = () => {
    return issues.filter((issue) => {
      const latDiff = Math.abs(issue.location.lat - mapCenter.lat);
      const lngDiff = Math.abs(issue.location.lng - mapCenter.lng);
      return latDiff < 0.15 && lngDiff < 0.15;
    });
  };

  // Helper to return specific category icons for custom markers
  const getCategoryIcon = (category: IssueCategory) => {
    switch (category) {
      case IssueCategory.POTHOLE:
        return <Construction className="h-4 w-4 text-white" />;
      case IssueCategory.WATER_LEAKAGE:
        return <Droplet className="h-4 w-4 text-white" />;
      case IssueCategory.STREETLIGHT_DAMAGE:
        return <Lightbulb className="h-4 w-4 text-white" />;
      case IssueCategory.WASTE_MANAGEMENT:
        return <Trash2 className="h-4 w-4 text-white" />;
      case IssueCategory.INFRASTRUCTURE:
        return <Wrench className="h-4 w-4 text-white" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-white" />;
    }
  };

  // Convert category to hexadecimal for Google Maps Pin background
  const getCategoryColorHex = (category: IssueCategory) => {
    switch (category) {
      case IssueCategory.POTHOLE:
        return "#f43f5e"; // rose-500
      case IssueCategory.WATER_LEAKAGE:
        return "#6366f1"; // indigo-500
      case IssueCategory.STREETLIGHT_DAMAGE:
        return "#f59e0b"; // amber-500
      case IssueCategory.WASTE_MANAGEMENT:
        return "#10b981"; // emerald-500
      case IssueCategory.INFRASTRUCTURE:
        return "#a855f7"; // purple-500
      default:
        return "#64748b"; // slate-500
    }
  };

  // Map lat/lng to percentage coordinates on vector map
  const getCoordinates = (lat: number, lng: number) => {
    const clampedLat = Math.min(Math.max(lat, LAT_MIN), LAT_MAX);
    const clampedLng = Math.min(Math.max(lng, LNG_MIN), LNG_MAX);

    const y = ((LAT_MAX - clampedLat) / (LAT_MAX - LAT_MIN)) * 100;
    const x = ((clampedLng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * 100;

    return { x: Math.min(Math.max(x, 5), 95), y: Math.min(Math.max(y, 5), 95) };
  };

  const getCategoryColorClass = (category: IssueCategory) => {
    switch (category) {
      case IssueCategory.POTHOLE:
        return "bg-rose-500 border-white";
      case IssueCategory.WATER_LEAKAGE:
        return "bg-indigo-500 border-white";
      case IssueCategory.STREETLIGHT_DAMAGE:
        return "bg-amber-500 border-white";
      case IssueCategory.WASTE_MANAGEMENT:
        return "bg-emerald-500 border-white";
      case IssueCategory.INFRASTRUCTURE:
        return "bg-purple-500 border-white";
      default:
        return "bg-slate-500 border-white";
    }
  };

  const wardsData = [
    {
      id: "ward1",
      name: "Ward 1 (Panchayat Center)",
      path: "M 10 10 L 55 10 L 45 45 L 10 40 Z",
      fill: "fill-emerald-500/10 hover:fill-emerald-500/20 stroke-emerald-500/50",
      activeFill: "fill-emerald-500/30 stroke-emerald-400 stroke-2",
      color: "text-emerald-600",
      stats: { resolved: 5, pending: 1, total: 6 },
    },
    {
      id: "ward2",
      name: "Ward 2 (Market Area)",
      path: "M 55 10 L 90 10 L 95 50 L 45 45 Z",
      fill: "fill-rose-500/10 hover:fill-rose-500/20 stroke-rose-500/50",
      activeFill: "fill-rose-500/30 stroke-rose-400 stroke-2",
      color: "text-rose-600",
      stats: { resolved: 8, pending: 3, total: 11 },
    },
    {
      id: "ward3",
      name: "Ward 3 (School District)",
      path: "M 10 40 L 45 45 L 35 90 L 10 80 Z",
      fill: "fill-indigo-500/10 hover:fill-indigo-500/20 stroke-indigo-500/50",
      activeFill: "fill-indigo-500/30 stroke-indigo-400 stroke-2",
      color: "text-indigo-600",
      stats: { resolved: 14, pending: 2, total: 16 },
    },
    {
      id: "ward4",
      name: "Ward 4 (Bypass)",
      path: "M 45 45 L 95 50 L 90 90 L 35 90 Z",
      fill: "fill-amber-500/10 hover:fill-amber-500/20 stroke-amber-500/50",
      activeFill: "fill-amber-500/30 stroke-amber-400 stroke-2",
      color: "text-amber-600",
      stats: { resolved: 12, pending: 4, total: 16 },
    },
  ];

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width;
    const yPct = (e.clientY - rect.top) / rect.height;

    const lat = LAT_MAX - yPct * (LAT_MAX - LAT_MIN);
    const lng = LNG_MIN + xPct * (LNG_MAX - LNG_MIN);

    setHoverCoords({
      lat: parseFloat(lat.toFixed(4)),
      lng: parseFloat(lng.toFixed(4)),
    });
  };

  const getIssuesForWard = (wardName: string) => {
    return issues.filter((i) =>
      i.location.ward
        .toLowerCase()
        .includes(wardName.split(" ")[0].toLowerCase()),
    );
  };

  return (
    <div
      id="map-view-root"
      className={`bg-white shadow-sm overflow-hidden flex flex-col lg:flex-row relative transition-all duration-300 ${isMaximized ? "border-0 w-full h-full" : "border-slate-200 border rounded-3xl h-[640px]"}`}
    >
      {/* Interactive Map Panel */}
      <div
        className={`flex-grow relative h-[380px] lg:h-full flex flex-col justify-between p-4 overflow-hidden border-r border-slate-100 transition-colors duration-350 ${
          mapMode === "satellite" ? "bg-slate-950" : "bg-slate-50"
        }`}
      >
        {/* Real Google Map Component */}
        {useRealMap && hasValidKey && (
          <div className="absolute inset-0 z-0 h-full w-full">
            <APIProvider apiKey={API_KEY} version="weekly">
              <Map
                defaultCenter={mapCenter}
                center={mapCenter}
                defaultZoom={mapZoom}
                zoom={mapZoom}
                mapId="DEMO_MAP_ID"
                internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
                style={{ width: "100%", height: "100%" }}
                mapTypeId={mapMode === "satellite" ? "satellite" : "roadmap"}
                zoomControl={true}
                fullscreenControl={true}
                mapTypeControl={true}
                streetViewControl={true}
                scaleControl={true}
                gestureHandling="greedy"
                onCameraChanged={(ev) => {
                  if (ev.detail.center) {
                    setMapCenter(ev.detail.center);
                    setHoverCoords({
                      lat: parseFloat(ev.detail.center.lat.toFixed(4)),
                      lng: parseFloat(ev.detail.center.lng.toFixed(4)),
                    });
                  }
                  if (typeof ev.detail.zoom === "number") {
                    setMapZoom(ev.detail.zoom);
                  }
                }}
              >
                {/* Active Nearby Issue Pins with Category Icons */}
                {getNearbyReports().map((issue) => {
                  const isUrgent =
                    issue.urgency === "Critical" || issue.urgency === "High";
                  const isSelected = selectedIssue?.id === issue.id;

                  // Apply ward boundaries filtering if selected
                  if (
                    selectedWard &&
                    !issue.location.ward.includes(selectedWard.split(" ")[0])
                  ) {
                    return null;
                  }

                  return (
                    <AdvancedMarker
                      key={issue.id}
                      position={{
                        lat: issue.location.lat,
                        lng: issue.location.lng,
                      }}
                      title={issue.title}
                      onClick={() => onSelectIssue(issue)}
                    >
                      <div
                        className="relative flex items-center justify-center cursor-pointer group shadow-md rounded-full border-2 border-white transition-all duration-200 hover:scale-110 hover:shadow-lg"
                        style={{
                          width: "38px",
                          height: "38px",
                          backgroundColor: getCategoryColorHex(issue.category),
                        }}
                      >
                        {getCategoryIcon(issue.category)}
                        {isUrgent && (
                          <span
                            className="absolute -inset-1.5 rounded-full animate-ping opacity-35"
                            style={{
                              backgroundColor: getCategoryColorHex(
                                issue.category,
                              ),
                              zIndex: -1,
                            }}
                          />
                        )}
                        {isSelected && (
                          <span className="absolute -inset-2 border-2 border-indigo-600 rounded-full animate-pulse z-40" />
                        )}
                      </div>
                    </AdvancedMarker>
                  );
                })}

                {/* User GPS Location Marker */}
                {userLocation && (
                  <AdvancedMarker
                    position={userLocation}
                    title="My Current GPS Location"
                  >
                    <div className="relative flex items-center justify-center">
                      <div className="absolute w-8 h-8 bg-blue-500/30 rounded-full animate-ping" />
                      <div className="w-4.5 h-4.5 bg-blue-600 border-2 border-white rounded-full shadow-lg flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      </div>
                    </div>
                  </AdvancedMarker>
                )}
              </Map>
            </APIProvider>
          </div>
        )}

        {/* API Key Missing - In-app setup assistant screen */}
        {useRealMap && !hasValidKey && (
          <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-20">
            <div className="max-w-md bg-slate-950/90 border border-slate-800 p-6 rounded-3xl shadow-2xl space-y-4 text-white">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto text-amber-500 border border-amber-500/30">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Google Maps API Key Required
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  To view the complete high-precision Real Map and locate
                  complaints with real physical GPS tracking, please configure
                  your API key.
                </p>
              </div>

              {/* Instructions steps */}
              <div className="text-left text-[10px] text-slate-300 space-y-2.5 bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 font-sans">
                <p className="font-bold text-indigo-400">Step-by-step Setup:</p>
                <div className="flex gap-2">
                  <span className="font-bold text-indigo-400">1.</span>
                  <span>
                    Get a key from the{" "}
                    <a
                      href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 underline hover:text-indigo-300 font-bold"
                    >
                      Google Cloud Console
                    </a>
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="font-bold text-indigo-400">2.</span>
                  <span>
                    Open <b>Settings</b> (⚙️ gear icon, top-right corner)
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="font-bold text-indigo-400">3.</span>
                  <span>
                    Select <b>Secrets</b>, and add{" "}
                    <code>GOOGLE_MAPS_PLATFORM_KEY</code>
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="font-bold text-indigo-400">4.</span>
                  <span>
                    Paste your API key and press Enter. The app compiles
                    instantly.
                  </span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => setUseRealMap(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold py-2.5 px-4 rounded-xl transition-all cursor-pointer"
                >
                  Use Interactive Vector Map
                </button>
                <button
                  type="button"
                  onClick={() => {
                    showToast(
                      "Configure GOOGLE_MAPS_PLATFORM_KEY in Secrets",
                      "info",
                    );
                  }}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold py-2.5 px-4 rounded-xl transition-all cursor-pointer"
                >
                  Setup Key In Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Top Control Bar with Mode and Geolocation Permission */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center pointer-events-auto">
          {/* Controls: Geolocation, Maximize & Mode */}
          <div className="flex items-center gap-2 bg-white/40 p-1 rounded-2xl backdrop-blur-sm border border-white/40 shadow-sm">
            {/* GPS Geolocation Request Button */}
            {useRealMap && hasValidKey && (
              <button
                type="button"
                onClick={handleLocateUser}
                className={`p-2.5 rounded-xl border shadow-md flex items-center justify-center cursor-pointer transition-all active:scale-95 ${
                  permissionStatus === "granted"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100"
                    : permissionStatus === "denied"
                      ? "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100"
                      : "bg-white/95 border-slate-200 text-indigo-600 hover:bg-slate-50"
                }`}
                title="Locate me with India GPS (requires browser permission)"
              >
                <Navigation
                  className={`h-4 w-4 ${permissionStatus === "loading" ? "animate-spin text-amber-500" : ""}`}
                />
                <span className="text-[10px] font-bold ml-1 hidden md:inline">
                  {permissionStatus === "loading"
                    ? "Acquiring..."
                    : "Share Location"}
                </span>
              </button>
            )}

            {/* Custom Maximize Toggle */}
            <button
              type="button"
              onClick={() => {
                if (!document.fullscreenElement) {
                  document
                    .getElementById("map-view-root")
                    ?.requestFullscreen()
                    .catch((err) => console.log(err));
                } else {
                  document.exitFullscreen().catch((err) => console.log(err));
                }
              }}
              className="p-2.5 rounded-xl border border-slate-200 bg-white/95 shadow-md flex items-center justify-center cursor-pointer transition-all active:scale-95 hover:bg-slate-50 text-indigo-600"
              title={isMaximized ? "Restore view" : "Maximize view"}
            >
              {isMaximized ? (
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 14h6v6m10-10h-6V4m0 6l7-7m-7 7l-7-7"
                  />
                </svg>
              ) : (
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                  />
                </svg>
              )}
            </button>
            <div className="w-px h-6 bg-slate-300 mx-1"></div>
            {/* Map Mode selectors */}
            <div className="bg-white/95 backdrop-blur-md p-1 rounded-xl border border-slate-200 shadow-md flex gap-0.5">
              {[
                { id: "street", label: "Street", icon: Globe },
                { id: "satellite", label: "Satellite", icon: Compass },
              ].map((mode) => {
                const isActive = mapMode === mode.id;
                const Icon = mode.icon;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setMapMode(mode.id as any)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                      isActive
                        ? "bg-slate-900 text-white shadow-sm scale-[1.01]"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="h-3 w-3" />
                    <span className="hidden sm:inline">{mode.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Info Coordinate HUD (bottom right) */}
        <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2 text-right pointer-events-none">
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800/80 p-2.5 rounded-xl text-[9px] font-mono text-slate-300 font-medium tracking-tight shadow-lg">
            <span className="text-indigo-400">COORDINATES:</span>{" "}
            {hoverCoords.lat.toFixed(4)}° N, {hoverCoords.lng.toFixed(4)}° E
          </div>
        </div>

        {/* Legend overlay (bottom left) */}
        <div
          className={`absolute bottom-4 left-4 z-15 backdrop-blur-md shadow-md p-2.5 rounded-xl flex gap-3 text-[10px] border transition-colors ${
            mapMode === "street"
              ? "bg-white/95 text-slate-600 border-slate-200"
              : "bg-slate-900/95 text-slate-300 border-slate-800"
          }`}
        >
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            <span>Potholes</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-indigo-500" />
            <span>Water</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span>Streetlights</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Garbage</span>
          </div>
        </div>

        {/* Vector SVG Layout (loaded only when real map is disabled or key is missing) */}
        {(!useRealMap || !hasValidKey) && (
          <div className="w-full h-full flex items-center justify-center relative p-8 pt-16 z-0">
            <svg
              id="vector-map-svg"
              viewBox="0 0 100 100"
              onMouseMove={handleMouseMove}
              className={`w-full h-full max-w-lg aspect-square select-none relative z-10 filter drop-shadow-md transition-all duration-300`}
            >
              {/* Roads Layout */}
              <path
                d="M 10 40 L 95 50"
                fill="none"
                className={
                  mapMode === "street" ? "stroke-slate-200" : "stroke-slate-800"
                }
                strokeWidth="3"
                strokeDasharray="1 1"
              />
              <path
                d="M 45 10 L 35 90"
                fill="none"
                className={
                  mapMode === "street" ? "stroke-slate-200" : "stroke-slate-800"
                }
                strokeWidth="2.5"
              />
              <path
                d="M 10 10 Q 50 30 90 10"
                fill="none"
                className={
                  mapMode === "street"
                    ? "stroke-slate-200/60"
                    : "stroke-slate-800/40"
                }
                strokeWidth="1.5"
              />

              {/* Wards Polygons */}
              {wardsData.map((ward) => {
                const isActive = selectedWard === ward.name;

                let fillClass = ward.fill;
                if (mapMode === "satellite") {
                  fillClass = isActive
                    ? "fill-indigo-500/20 stroke-indigo-400 stroke-2"
                    : "fill-slate-950/40 hover:fill-indigo-950/15 stroke-slate-800";
                } else {
                  fillClass = isActive ? ward.activeFill : ward.fill;
                }

                return (
                  <path
                    key={ward.id}
                    id={`map-ward-${ward.id}`}
                    d={ward.path}
                    className={`transition-all duration-300 cursor-pointer ${fillClass}`}
                    onMouseEnter={() => setHoveredWard(ward.id)}
                    onMouseLeave={() => setHoveredWard(null)}
                    onClick={() => onSelectWard(isActive ? null : ward.name)}
                  />
                );
              })}

              {/* Grid references */}
              <line
                x1="50"
                y1="0"
                x2="50"
                y2="100"
                className={
                  mapMode === "street"
                    ? "stroke-slate-200/30"
                    : "stroke-slate-800/30"
                }
                strokeWidth="0.5"
                strokeDasharray="2 2"
              />
              <line
                x1="0"
                y1="50"
                x2="100"
                y2="50"
                className={
                  mapMode === "street"
                    ? "stroke-slate-200/30"
                    : "stroke-slate-800/30"
                }
                strokeWidth="0.5"
                strokeDasharray="2 2"
              />
            </svg>

            {/* Coordinate-mapped Pins dynamically */}
            {issues.map((issue) => {
              const { x, y } = getCoordinates(
                issue.location.lat,
                issue.location.lng,
              );
              const isSelected = selectedIssue?.id === issue.id;
              const isUrgent =
                issue.urgency === "Critical" || issue.urgency === "High";

              if (
                selectedWard &&
                !issue.location.ward.includes(selectedWard.split(" ")[0])
              ) {
                return null;
              }

              return (
                <button
                  key={issue.id}
                  id={`map-pin-${issue.id}`}
                  onClick={() => onSelectIssue(issue)}
                  style={{ left: `${x}%`, top: `${y}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 group transition-all p-1 rounded-full cursor-pointer hover:scale-125 duration-200 ${
                    isSelected ? "scale-125 z-30" : ""
                  }`}
                >
                  {isUrgent && (
                    <span
                      className={`absolute inset-0 rounded-full animate-ping opacity-60 ${
                        issue.category === IssueCategory.POTHOLE
                          ? "bg-rose-400"
                          : issue.category === IssueCategory.WATER_LEAKAGE
                            ? "bg-indigo-400"
                            : issue.category ===
                                IssueCategory.STREETLIGHT_DAMAGE
                              ? "bg-amber-400"
                              : "bg-emerald-400"
                      }`}
                    />
                  )}
                  <div
                    className={`w-3.5 h-3.5 rounded-full border-2 shadow flex items-center justify-center ${getCategoryColorClass(issue.category)} ${
                      isSelected ? "ring-4 ring-indigo-500/40" : ""
                    }`}
                  >
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  </div>

                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1 px-2 rounded-md font-sans whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-50">
                    <p className="font-bold text-left">{issue.title}</p>
                    <p className="text-slate-400 font-mono text-left">
                      {issue.location.ward} • {issue.status}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={confirmLocation !== null}
        title="Report from your location?"
        message={`Do you want to report an issue from your current live location? (${confirmLocation?.lat.toFixed(4)}, ${confirmLocation?.lng.toFixed(4)})`}
        confirmLabel="Yes, Report"
        cancelLabel="Cancel"
        onConfirm={() => {
          if (confirmLocation && onReportFromLocation) {
            onReportFromLocation({
              lat: confirmLocation.lat,
              lng: confirmLocation.lng,
              address: `GPS: ${confirmLocation.lat.toFixed(4)}, ${confirmLocation.lng.toFixed(4)}`,
              ward: "Ward 1 (Panchayat Center)", // Defaulting or could compute
            });
          }
          setConfirmLocation(null);
        }}
        onCancel={() => setConfirmLocation(null)}
        type="info"
      />
    </div>
  );
}
