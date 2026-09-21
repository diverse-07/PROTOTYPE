import React, { useState } from "react"
import ErrorBoundary from "./ErrorBoundary"
import AppDesktop from "./AppDesktop"
import AppMobile from "./AppMobile"
import LoginPage from "./LoginPage"

export default function App() {
  // Authentication state (Session/LocalStorage persistence)
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const params = new URLSearchParams(window.location.search)
        if (params.get("auth") === "1" || params.get("auth") === "true") return true
        return (
          localStorage.getItem("aegis_auth") === "true" ||
          sessionStorage.getItem("aegis_auth") === "true"
        )
      } catch (e) {}
    }
    return false
  })

  // Mode: check URL query param first, then Capacitor native app check.
  // NOTE: On phone browsers, we DO NOT force mobile app now — the official Authority Page is shown!
  const [mode, setMode] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const params = new URLSearchParams(window.location.search)
        const m = params.get("mode") || params.get("view")
        if (m === "mobile" || m === "app" || m === "citizen") return "mobile"
        if (m === "desktop" || m === "portal" || m === "authority") return "desktop"
        
        // Only default to mobile if running inside the compiled Android APK
        const isNative = !!(
          (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) ||
          window.location.protocol === "capacitor:" ||
          window.location.protocol === "file:" ||
          window.location.search.includes("mode=native_app")
        )
        if (isNative) return "mobile"
      } catch (e) {}
    }
    // Default to official Authority Portal for all web visitors (both desktop & phone browsers)
    return "desktop"
  })

  const handleSwitchToMobile = () => {
    setMode("mobile")
    if (typeof window !== "undefined" && window.history.pushState) {
      try {
        const url = new URL(window.location)
        url.searchParams.set("mode", "mobile")
        window.history.pushState({}, "", url)
      } catch (e) {}
    }
  }

  const handleSwitchToDesktop = () => {
    setMode("desktop")
    if (typeof window !== "undefined" && window.history.pushState) {
      try {
        const url = new URL(window.location)
        url.searchParams.set("mode", "desktop")
        window.history.pushState({}, "", url)
      } catch (e) {}
    }
  }

  const handleLoginSuccess = () => {
    try {
      localStorage.setItem("aegis_auth", "true")
      sessionStorage.setItem("aegis_auth", "true")
    } catch (e) {}
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    try {
      localStorage.removeItem("aegis_auth")
      sessionStorage.removeItem("aegis_auth")
    } catch (e) {}
    setIsAuthenticated(false)
  }

  return (
    <ErrorBoundary>
      <div className="aegis-app-root">
        {mode === "mobile" ? (
          <AppMobile onSwitchToDesktop={handleSwitchToDesktop} />
        ) : !isAuthenticated ? (
          <LoginPage
            onLoginSuccess={handleLoginSuccess}
            onSwitchToCitizen={handleSwitchToMobile}
          />
        ) : (
          <AppDesktop
            onSwitchToMobile={handleSwitchToMobile}
            onLogout={handleLogout}
          />
        )}
      </div>
    </ErrorBoundary>
  )
}
