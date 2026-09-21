import React from 'react'
import AppMobile from './AppMobile'

export default function App() {
  // Check if running inside the native Android APK container:
  const isNativeApp = typeof window !== 'undefined' && (
    (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) ||
    window.location.protocol === 'capacitor:' ||
    window.location.protocol === 'file:' ||
    window.location.search.includes('mode=native_app')
  );

  // Check if citizen mobile app view is explicitly requested via URL params
  const isCitizenMode = typeof window !== 'undefined' && (
    window.location.search.includes('mode=citizen') ||
    window.location.search.includes('mode=app') ||
    window.location.search.includes('mode=mobile') ||
    window.location.hash.includes('#citizen')
  );

  // 1. If inside native Android APK or citizen mode explicitly requested -> render Citizen Mobile App
  if (isNativeApp || isCitizenMode) {
    return <AppMobile />;
  }

  // 2. On standard web (laptop, tablet, OR mobile phone), ALWAYS show the Authority Command Center!
  if (typeof window !== 'undefined') {
    if (!window.location.pathname.includes('desktop.html')) {
      const search = window.location.search || '';
      const hash = window.location.hash || '';
      window.location.replace('./desktop.html' + search + hash);
      return null;
    }
  }

  // 3. Fallback: If at /desktop.html and rendered via React/Vite, display the Authority Portal in full screen
  return (
    <iframe
      src="./desktop.html"
      title="NER-LEWS Authority Command Center"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        border: 'none',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        zIndex: 999999
      }}
    />
  );
}
