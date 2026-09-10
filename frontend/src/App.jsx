import React, { useState } from "react"
import ErrorBoundary from "./ErrorBoundary"
import AppDesktop from "./AppDesktop"
import AppMobile from "./AppMobile"

export default function App() {
  // Determine mode: check URL query param first, then window width / Capacitor
  const [mode, setMode] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const params = new URLSearchParams(window.location.search);
        const m = params.get("mode") || params.get("view");
        if (m === "mobile" || m === "app" || m === "citizen") return "mobile";
        if (m === "desktop" || m === "portal" || m === "authority") return "desktop";
        const isNative = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
        if (isNative || window.innerWidth <= 768) return "mobile";
      } catch (e) {}
    }
    return "desktop";
  });

  const handleSwitchToMobile = () => {
    setMode("mobile");
    if (typeof window !== "undefined" && window.history.pushState) {
      try {
        const url = new URL(window.location);
        url.searchParams.set("mode", "mobile");
        window.history.pushState({}, "", url);
      } catch (e) {}
    }
  };

  const handleSwitchToDesktop = () => {
    setMode("desktop");
    if (typeof window !== "undefined" && window.history.pushState) {
      try {
        const url = new URL(window.location);
        url.searchParams.set("mode", "desktop");
        window.history.pushState({}, "", url);
      } catch (e) {}
    }
  };

  return (
    <ErrorBoundary>
      <div className="aegis-app-root">
        {mode === "mobile" ? (
          <AppMobile onSwitchToDesktop={handleSwitchToDesktop} />
        ) : (
          <AppDesktop onSwitchToMobile={handleSwitchToMobile} />
        )}
      </div>
    </ErrorBoundary>
  );
}

