import React, { useState } from "react"

export default function LoginPage({ onLoginSuccess, onSwitchToCitizen }) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    setTimeout(() => {
      // Check credentials
      const u = username.trim().toLowerCase()
      const p = password.trim()

      if (u === "prototype" && p === "prototype") {
        try {
          localStorage.setItem("aegis_auth", "true")
          sessionStorage.setItem("aegis_auth", "true")
        } catch (err) {}
        setLoading(false)
        onLoginSuccess()
      } else {
        setLoading(false)
        setError("Invalid credentials. Access restricted to authorized personnel. Use username: prototype | password: prototype")
      }
    }, 450)
  }

  const handleAutoFill = () => {
    setUsername("prototype")
    setPassword("prototype")
    setError("")
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-b from-[#F1F5F9] via-[#E2E8F0] to-[#CBD5E1] font-sans text-slate-800 antialiased selection:bg-[#003B73] selection:text-white">
      
      {/* Top Indian Tricolor Strip */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#FF9933] via-[#FFFFFF] to-[#138808] shadow-xs"></div>

      {/* Official Top Bar */}
      <header className="bg-white border-b border-slate-200 py-3 px-4 sm:px-6 lg:px-8 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="./emblem.png"
              alt="Government of India"
              className="h-11 sm:h-12 w-auto object-contain"
              onError={(e) => {
                e.target.src = "https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg"
              }}
            />
            <div className="leading-tight">
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-black tracking-tight text-[#003B73]">
                  MDoNER
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-[#005B9E] border border-blue-200 uppercase">
                  Government of India
                </span>
              </div>
              <div className="text-[11px] sm:text-xs font-bold text-slate-800">
                Ministry of Development of North Eastern Region
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                उत्तर पूर्वी क्षेत्र विकास मंत्रालय · National Disaster Management Division
              </div>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-mono font-bold text-slate-700">EOC Command Link: ACTIVE</span>
          </div>
        </div>
      </header>

      {/* Main Login Card Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          {/* Card Header */}
          <div className="bg-[#003B73] px-6 py-6 text-white text-center relative overflow-hidden">
            <div className="absolute -right-8 -bottom-8 w-28 h-28 rounded-full bg-white/5 pointer-events-none"></div>
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 border border-white/20 mb-3 shadow-inner">
              <span className="material-symbols-outlined text-2xl text-amber-300">security</span>
            </div>
            <h1 className="text-xl font-black tracking-tight uppercase">
              EOC Authority Portal
            </h1>
            <p className="text-xs text-blue-100 font-medium mt-1">
              NER-LEWS · Landslide Early Warning &amp; Response Command
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 bg-white/15 px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-amber-200 tracking-wide border border-white/10">
              <span>●</span>
              <span>RESTRICTED ACCESS · AUTHORIZED OFFICIALS ONLY</span>
            </div>
          </div>

          {/* Card Body & Form */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-4">
            
            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700 animate-shake">
                <span className="material-symbols-outlined text-red-600 text-base shrink-0 mt-0.5">error</span>
                <span className="font-medium leading-relaxed">{error}</span>
              </div>
            )}

            {/* Username Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                Officer ID / Username
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-lg">
                  badge
                </span>
                <input
                  type="text"
                  required
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username (prototype)"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#005B9E] focus:bg-white transition"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide flex items-center justify-between">
                <span>Security PIN / Password</span>
                <span className="text-[10px] text-slate-400 font-normal">Case-sensitive</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-lg">
                  lock
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password (prototype)"
                  className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#005B9E] focus:bg-white transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  <span className="material-symbols-outlined text-lg">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* Quick 1-Click Auto Fill Demo Credentials Pill */}
            <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 flex items-center justify-between gap-2">
              <div className="text-[11px] text-amber-900">
                <span className="font-bold block">Demo Credentials:</span>
                <code className="font-mono text-amber-950 font-bold bg-amber-100/70 px-1 py-0.5 rounded">prototype</code> / <code className="font-mono text-amber-950 font-bold bg-amber-100/70 px-1 py-0.5 rounded">prototype</code>
              </div>
              <button
                type="button"
                onClick={handleAutoFill}
                className="bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1 rounded-md text-xs font-bold transition shadow-2xs cursor-pointer shrink-0"
              >
                Auto-Fill ⚡
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[#003B73] hover:bg-[#002C57] active:bg-[#001E3C] text-white font-bold text-sm rounded-lg shadow-sm hover:shadow transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Verifying Officer Credentials...</span>
                </>
              ) : (
                <>
                  <span>Authenticate &amp; Enter Portal</span>
                  <span className="material-symbols-outlined text-base">login</span>
                </>
              )}
            </button>

            {/* Optional Citizen App switch button */}
            {onSwitchToCitizen && (
              <div className="pt-2 text-center border-t border-slate-100">
                <button
                  type="button"
                  onClick={onSwitchToCitizen}
                  className="text-[11px] text-slate-500 hover:text-[#005B9E] font-semibold transition inline-flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">smartphone</span>
                  <span>Looking for Citizen Mobile Alert App? Click here</span>
                </button>
              </div>
            )}
          </form>

          {/* Security & Audit Footer */}
          <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between text-[10px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-slate-400 text-sm">verified_user</span>
              <span>256-Bit TLS Clearance</span>
            </div>
            <div className="font-mono text-slate-400">
              NIC-CERT-IN L4
            </div>
          </div>
        </div>
      </main>

      {/* Official Footer */}
      <footer className="bg-white border-t border-slate-200 py-3 px-4 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>National Informatics Centre (NIC) · Disaster Early Warning Division</span>
          <span>National Emergency Helpline: <strong className="text-slate-800">1078 / 112</strong></span>
        </div>
      </footer>

    </div>
  )
}
