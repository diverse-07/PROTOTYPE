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
              bottom: "18px",
              right: "20px",
              zIndex: 99999,
              background: "rgba(8, 12, 20, 0.88)",
              backdropFilter: "blur(24px) saturate(180%)",
              WebkitBackdropFilter: "blur(24px) saturate(180%)",
              border: "1px solid rgba(255, 255, 255, 0.14)",
              borderRadius: "30px",
              padding: "4px 6px",
              boxShadow: "0 16px 36px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}
          >
            <button
              onClick={() => setIsMobileView(false)}
              style={{
                background: !isMobileView ? "linear-gradient(135deg, #0284c7, #0369a1)" : "transparent",
                color: "#ffffff",
                border: !isMobileView ? "1px solid rgba(255,255,255,0.2)" : "none",
                borderRadius: "20px",
                padding: "6px 14px",
                fontSize: "11px",
                fontWeight: "700",
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: !isMobileView ? "0 4px 12px rgba(2,132,199,0.3)" : "none"
              }}
            >
              <span>💻</span> <span>3D Web Portal</span>
            </button>
            <button
              onClick={() => setIsMobileView(true)}
              style={{
                background: isMobileView ? "linear-gradient(135deg, #059669, #047857)" : "transparent",
                color: "#ffffff",
                border: isMobileView ? "1px solid rgba(255,255,255,0.2)" : "none",
                borderRadius: "20px",
                padding: "6px 14px",
                fontSize: "11px",
                fontWeight: "700",
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: isMobileView ? "0 4px 12px rgba(5,150,105,0.3)" : "none"
              }}
            >
              <span>📱</span> <span>Citizen Mobile</span>
            </button>
          </aside>
        )}

        {isMobileView ? <AppMobile /> : <AppDesktop />}
      </div>
    </ErrorBoundary>
  )
}
