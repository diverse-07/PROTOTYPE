import React, { useState } from 'react'

export default function GlassDock({
  activeView, // 'globe' | 'gis'
  onSelectView,
  onLocateMe,
  onOpenSirenModal,
  onToggleTelemetry,
  telemetryOpen,
  onToggleStress,
  stressOpen,
  onPlaySirenTest,
  isSirenPlaying,
  onOpenApkModal,
  autoRotate,
  onToggleAutoRotate
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null)

  const dockItems = [
    {
      id: 'globe',
      label: '3D Earth Orbit',
      icon: '🌍',
      category: 'view',
      active: activeView === 'globe',
      onClick: () => onSelectView('globe'),
      description: 'Planetary 3D Space View'
    },
    {
      id: 'gis',
      label: '2D Satellite GIS',
      icon: '🛰️',
      category: 'view',
      active: activeView === 'gis',
      onClick: () => onSelectView('gis'),
      description: 'High-Res Topo Contours & Polygons'
    },
    {
      id: 'separator-1',
      isSeparator: true
    },
    {
      id: 'locate',
      label: 'My Location',
      icon: '📍',
      category: 'action',
      onClick: onLocateMe,
      description: 'Zoom Camera to Live GPS Pin'
    },
    {
      id: 'siren',
      label: 'Broadcast Siren',
      icon: '🚨',
      category: 'action',
      highlight: true,
      onClick: onOpenSirenModal,
      description: 'BLE Mesh & Cloud Dispatch'
    },
    {
      id: 'telemetry',
      label: 'Live Sensors',
      icon: '📡',
      category: 'action',
      active: telemetryOpen,
      onClick: onToggleTelemetry,
      description: 'Real-Time Telemetry Stream'
    },
    {
      id: 'stress',
      label: 'Stress Engine',
      icon: '⚡',
      category: 'action',
      active: stressOpen,
      onClick: onToggleStress,
      description: 'Cloudburst Rainfall Multiplier'
    },
    {
      id: 'separator-2',
      isSeparator: true
    },
    {
      id: 'audio',
      label: isSirenPlaying ? 'Mute Siren' : 'Test Siren Tone',
      icon: isSirenPlaying ? '🔊' : '🔔',
      category: 'tool',
      active: isSirenPlaying,
      onClick: onPlaySirenTest,
      description: '750Hz-1250Hz NDMA Audio Tone'
    },
    {
      id: 'apk',
      label: 'Citizen APK',
      icon: '📱',
      category: 'tool',
      onClick: onOpenApkModal,
      description: 'Download Android Offline Mesh App'
    },
    {
      id: 'rotate',
      label: autoRotate ? 'Pause Orbit' : 'Auto Orbit',
      icon: autoRotate ? '⏸️' : '▶️',
      category: 'setting',
      active: autoRotate,
      onClick: onToggleAutoRotate,
      description: 'Planetary Continuous Rotation'
    }
  ]

  return (
    <aside
      aria-label="Interactive System Dock"
      className="framer-dock-container"
      style={{
        position: 'fixed',
        bottom: '22px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9000,
        pointerEvents: 'auto'
      }}
    >
      <div
        className="framer-dock"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 14px',
          background: 'rgba(8, 12, 20, 0.78)',
          backdropFilter: 'blur(28px) saturate(190%)',
          WebkitBackdropFilter: 'blur(28px) saturate(190%)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          borderRadius: '40px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {dockItems.map((item, idx) => {
          if (item.isSeparator) {
            return (
              <div
                key={item.id}
                style={{
                  width: '1px',
                  height: '24px',
                  background: 'rgba(255, 255, 255, 0.12)',
                  margin: '0 2px'
                }}
              />
            )
          }

          const isHovered = hoveredIdx === idx
          const isSelected = item.active

          return (
            <div
              key={item.id}
              style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {isHovered && (
                <div
                  className="framer-tooltip"
                  style={{
                    position: 'absolute',
                    bottom: '54px',
                    background: 'rgba(15, 23, 42, 0.95)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: '600',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                    pointerEvents: 'none'
                  }}
                >
                  <span style={{ color: '#38bdf8' }}>{item.label}</span>
                  {item.description && (
                    <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: '400' }}>
                      {item.description}
                    </span>
                  )}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-4px',
                      left: '50%',
                      transform: 'translateX(-50%) rotate(45deg)',
                      width: '8px',
                      height: '8px',
                      background: 'rgba(15, 23, 42, 0.95)',
                      borderRight: '1px solid rgba(255, 255, 255, 0.18)',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.18)'
                    }}
                  />
                </div>
              )}

              <button
                onClick={item.onClick}
                aria-label={item.label}
                style={{
                  width: isHovered ? '46px' : '40px',
                  height: isHovered ? '46px' : '40px',
                  borderRadius: '16px',
                  border: item.highlight
                    ? '1px solid rgba(239, 68, 68, 0.6)'
                    : isSelected
                    ? '1px solid rgba(56, 189, 248, 0.5)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  background: item.highlight
                    ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.35) 0%, rgba(185, 28, 28, 0.2) 100%)'
                    : isSelected
                    ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.28) 0%, rgba(30, 58, 138, 0.2) 100%)'
                    : 'rgba(255, 255, 255, 0.04)',
                  boxShadow: item.highlight
                    ? '0 0 16px rgba(239, 68, 68, 0.4)'
                    : isSelected
                    ? '0 0 16px rgba(56, 189, 248, 0.35)'
                    : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: isHovered ? '22px' : '18px',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  transform: isHovered ? 'translateY(-6px)' : 'none',
                  outline: 'none'
                }}
              >
                <span>{item.icon}</span>
              </button>

              <div
                style={{
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  marginTop: '4px',
                  background: item.highlight
                    ? '#ef4444'
                    : isSelected
                    ? '#38bdf8'
                    : 'transparent',
                  boxShadow: isSelected ? '0 0 6px #38bdf8' : 'none',
                  transition: 'background 0.2s'
                }}
              />
            </div>
          )
        })}
      </div>
    </aside>
  )
}
