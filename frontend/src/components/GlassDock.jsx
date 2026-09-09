import React, { useState } from 'react'

export default function GlassDock({
  activeView,
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
      label: '3D Orbit',
      icon: '🌍',
      active: activeView === 'globe',
      onClick: () => onSelectView('globe'),
      description: 'Planetary Earth View'
    },
    {
      id: 'gis',
      label: 'Satellite GIS',
      icon: '🛰️',
      active: activeView === 'gis',
      onClick: () => onSelectView('gis'),
      description: 'Topographic Contour Polygons'
    },
    {
      id: 'separator-1',
      isSeparator: true
    },
    {
      id: 'locate',
      label: 'My Position',
      icon: '📍',
      onClick: onLocateMe,
      description: 'Fly to GPS Coordinates'
    },
    {
      id: 'siren',
      label: 'Dispatch Siren',
      icon: '🚨',
      onClick: onOpenSirenModal,
      description: 'BLE Radio & Cloud Alert'
    },
    {
      id: 'telemetry',
      label: 'Corridors & Sensors',
      icon: '📡',
      active: telemetryOpen,
      onClick: onToggleTelemetry,
      description: 'Live Geological Readings'
    },
    {
      id: 'stress',
      label: 'Stress Simulation',
      icon: '⚡',
      active: stressOpen,
      onClick: onToggleStress,
      description: 'Monsoon Rainfall Factor'
    },
    {
      id: 'separator-2',
      isSeparator: true
    },
    {
      id: 'audio',
      label: isSirenPlaying ? 'Stop Audio' : 'Audio Tone Test',
      icon: isSirenPlaying ? '🔕' : '🔊',
      active: isSirenPlaying,
      onClick: onPlaySirenTest,
      description: 'NDMA 750-1250Hz Audio Tone'
    },
    {
      id: 'apk',
      label: 'Citizen APK',
      icon: '📱',
      onClick: onOpenApkModal,
      description: 'Android Offline Mesh APK'
    },
    {
      id: 'rotate',
      label: autoRotate ? 'Pause Rotation' : 'Auto Rotation',
      icon: autoRotate ? '⏸️' : '▶️',
      active: autoRotate,
      onClick: onToggleAutoRotate,
      description: 'Planetary Drift Rotation'
    }
  ]

  return (
    <aside
      aria-label="System Dock"
      style={{
        position: 'fixed',
        bottom: '18px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9000,
        pointerEvents: 'auto',
        maxWidth: 'calc(100vw - 20px)'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 10px',
          background: 'rgba(13, 16, 22, 0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '20px',
          boxShadow: '0 16px 36px rgba(0, 0, 0, 0.6)'
        }}
      >
        {dockItems.map((item, idx) => {
          if (item.isSeparator) {
            return (
              <div
                key={item.id}
                style={{
                  width: '1px',
                  height: '18px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  margin: '0 1px'
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
                  style={{
                    position: 'absolute',
                    bottom: '46px',
                    background: 'rgba(18, 22, 30, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: '500',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
                    pointerEvents: 'none'
                  }}
                >
                  <span>{item.label}</span>
                </div>
              )}

              <button
                onClick={item.onClick}
                aria-label={item.label}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  border: isSelected
                    ? '1px solid rgba(255, 255, 255, 0.2)'
                    : '1px solid transparent',
                  background: isSelected
                    ? 'rgba(255, 255, 255, 0.1)'
                    : isHovered
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease-out',
                  outline: 'none'
                }}
              >
                <span>{item.icon}</span>
              </button>

              <div
                style={{
                  width: '3px',
                  height: '3px',
                  borderRadius: '50%',
                  marginTop: '2px',
                  background: isSelected ? '#38bdf8' : 'transparent',
                  transition: 'background 0.15s'
                }}
              />
            </div>
          )
        })}
      </div>
    </aside>
  )
}
