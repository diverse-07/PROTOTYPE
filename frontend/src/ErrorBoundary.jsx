import React from "react"

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error("[AEGIS ErrorBoundary] Caught UI Exception:", error, errorInfo)
    this.setState({ error, errorInfo })
  }

  handleReset = () => {
    try {
      if (typeof window !== "undefined") {
        sessionStorage.clear()
        window.location.reload()
      }
    } catch (e) {
      window.location.reload()
    }
  }

  handleFullClear = () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.clear()
        sessionStorage.clear()
        window.location.replace("/")
      }
    } catch (e) {
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b2545",
          color: "#ffffff",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          padding: "20px"
        }}>
          <div style={{
            maxWidth: "480px",
            width: "100%",
            background: "#ffffff",
            color: "#1e293b",
            borderRadius: "16px",
            padding: "28px 24px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
            textAlign: "center"
          }}>
            <div style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "#fee2e2",
              color: "#dc2626",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              fontSize: "26px"
            }}>
              ⚠️
            </div>

            <div style={{ fontSize: "11px", fontWeight: "800", color: "#c59b27", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "4px" }}>
              TEAM AEGIS &bull; RECOVERY PROTOCOL
            </div>
            <h2 style={{ margin: "0 0 8px 0", fontSize: "18px", color: "#0b2545", fontWeight: "800" }}>
              Interface Safely Protected
            </h2>
            <p style={{ fontSize: "13px", color: "#64748b", lineHeight: "1.5", margin: "0 0 20px 0" }}>
              The system intercepted a component render exception and prevented a system crash or white screen.
            </p>

            <div style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "10px 12px",
              fontSize: "11.5px",
              fontFamily: "monospace",
              color: "#991b1b",
              textAlign: "left",
              maxHeight: "120px",
              overflowY: "auto",
              marginBottom: "20px"
            }}>
              {this.state.error?.toString() || "Unknown Component Exception"}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <button
                onClick={this.handleReset}
                style={{
                  width: "100%",
                  background: "#1e40af",
                  color: "#ffffff",
                  border: "none",
                  padding: "12px",
                  borderRadius: "8px",
                  fontWeight: "700",
                  fontSize: "13px",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(30,64,175,0.3)"
                }}
              >
                🔄 Reload System Interface
              </button>

              <button
                onClick={this.handleFullClear}
                style={{
                  width: "100%",
                  background: "#f1f5f9",
                  color: "#475569",
                  border: "1px solid #cbd5e1",
                  padding: "10px",
                  borderRadius: "8px",
                  fontWeight: "600",
                  fontSize: "12px",
                  cursor: "pointer"
                }}
              >
                🧹 Clear Local Cache &amp; Reset
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
