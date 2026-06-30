import { useState, useCallback } from "react";

export interface LocationCoords {
  lat: number;
  lng: number;
}

export function useLiveLocation() {
  const [coords, setCoords] = useState<LocationCoords | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "granted" | "denied" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const getLiveLocation = useCallback(
    (
      onSuccess?: (coords: LocationCoords) => void,
      onError?: (error: GeolocationPositionError) => void
    ) => {
      if (!navigator.geolocation) {
        setStatus("error");
        setErrorMsg("Geolocation is not supported by your browser.");
        return;
      }

      setStatus("loading");
      setErrorMsg(null);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCoords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCoords(newCoords);
          setStatus("granted");
          if (onSuccess) {
            onSuccess(newCoords);
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          setStatus("denied");
          let msg = "Could not fetch live location.";
          if (error.code === error.PERMISSION_DENIED) {
            msg = "Location permission denied. Please allow location access in your browser settings.";
          }
          setErrorMsg(msg);
          if (onError) {
            onError(error);
          }
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    },
    []
  );

  return {
    coords,
    status,
    errorMsg,
    getLiveLocation,
    isSupported: typeof navigator !== "undefined" && "geolocation" in navigator,
  };
}
