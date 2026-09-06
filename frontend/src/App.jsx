import React from 'react'
import { Capacitor } from '@capacitor/core'
import AppMobile from './AppMobile'

export default function App() {
  // Check if running inside the native Android APK or mobile app container:
  // 1. Capacitor native platform (Realme GT, Android/iOS runtime)
  // 2. Local asset protocol (capacitor:, file:)
  // 3. Explicit mobile query parameter (?mode=mobile, ?mode=native_app, ?app=true)
  const isNativeApp = typeof window !== 'undefined' && (
    Capacitor.isNativePlatform() ||
    (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) ||
    window.location.protocol === 'capacitor:' ||
    window.location.protocol === 'file:' ||
    window.location.search.includes('mode=native_app') ||
    window.location.search.includes('mode=mobile') ||
    window.location.search.includes('app=true')
  );

  // If inside the native Android APK, ALWAYS render the native mobile app
  if (isNativeApp) {
    return <AppMobile />;
  }

  // If in a standard web browser on desktop, redirect to the Authority Desktop Portal (website stays untouched)
  if (typeof window !== 'undefined') {
    if (!window.location.pathname.includes('desktop.html')) {
      const search = window.location.search || '';
      const hash = window.location.hash || '';
      window.location.replace('./desktop.html' + search + hash);
      return null;
    }
  }

  return <AppMobile />;
}
