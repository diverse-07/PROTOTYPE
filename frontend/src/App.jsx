import React from "react"
import ErrorBoundary from "./ErrorBoundary"
import AppDesktop from "./AppDesktop"

export default function App() {
  return (
    <ErrorBoundary>
      <div className="aegis-app-root">
        <AppDesktop />
      </div>
    </ErrorBoundary>
  )
}

