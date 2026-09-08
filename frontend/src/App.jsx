import React, { useState, useEffect } from "react"
import { Capacitor } from "@capacitor/core"
import ErrorBoundary from "./ErrorBoundary"
import AppMobile from "./AppMobile"
import AppDesktop from "./AppDesktop"

function detectIsMobile() {
  if (typeof window === "undefined") return false

  // 1. Native Capacitor platform (Android APK)
  if (
    Capacitor.isNativePlatform() ||
    (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform())
  ) {
    return true
  }

  // 2. Local asset protocols
  if (window.location.protocol === "capacitor:" || window.location.protocol === "file:") {
    return true
  }

  // 3. Explicit query parameters
  const search = window.location.search || ""
  if (search.includes("mode=mobile") || search.includes("mode=native_app") || search.includes("app=true")) {
    return true
  }
  if (search.includes("mode=desktop")) {
    return false
  }

  // 4. Viewport & user-agent check
  return (
    window.innerWidth <= 768 ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  )
}

export default function App() {
  const [isMobileView, setIsMobileView] = useState(detectIsMobile)

  // Re-check on viewport resize (unless in native APK)
  useEffect(() => {
    if (Capacitor.isNativePlatform()) return

    const onResize = () => {
      const search = window.location.search || ""
      if (!search.includes("mode=")) {
        setIsMobileView(detectIsMobile())
      }
    }
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  // Floating switcher pill in browser mode (allows judges / reviewers to switch between Citizen Mobile and Authority Portal)
  const isNative = typeof window !== "undefined" && Capacitor.isNativePlatform()

  return (
    <ErrorBoundary>
      <div className="aegis-app-root">
        {/* Floating View Switcher Pill for web browsers */}
        {!isNative && (
          <aside
            aria-label="Portal View Switcher"
            style={{
              position: "fixed",
              bottom: "16px",
              right: "16px",
              zIndex: 99999,
              background: "rgba(11, 37, 69, 0.94)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              borderRadius: "30px",
              padding: "4px 6px",
              boxShadow: "0 8px 28px rgba(0,0,0,0.35)",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}
          >
            <button
              onClick={() => setIsMobileView(false)}
              style={{
                background: !isMobileView ? "#1e40af" : "transparent",
                color: "#ffffff",
                border: "none",
                borderRadius: "20px",
                padding: "6px 12px",
                fontSize: "11px",
                fontWeight: "700",
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: "5px"
              }}
            >
              <span>💻</span> <span>Authority Portal</span>
            </button>
            <button
              onClick={() => setIsMobileView(true)}
              style={{
                background: isMobileView ? "#059669" : "transparent",
                color: "#ffffff",
                border: "none",
                borderRadius: "20px",
                padding: "6px 12px",
                fontSize: "11px",
                fontWeight: "700",
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: "5px"
              }}
            >
              <span>📱</span> <span>Citizen App</span>
            </button>
          </aside>
        )}

        {isMobileView ? <AppMobile /> : <AppDesktop />}
      </div>
    </ErrorBoundary>
  )
}
