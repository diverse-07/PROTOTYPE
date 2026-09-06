// Smart Device & Environment Router:
// 1. Web Browser (Desktop PC, Mac, Laptop, Android Phone Browser, iPhone Safari):
//    -> STRICTLY the Official Government Authority Portal (MDoNER / GSI / NDMA)
//       with ALL features (GIS Hazard Maps, In-Situ Telemetry, SOS Siren & Bluetooth, AI Predictions, Dispatch).
// 2. Installed Native Mobile APK (Capacitor Android Runtime on Realme GT / Android):
//    -> Native Mobile App (AppMobile) with an instant option to switch to the Authority Control Room.

import React from 'react'
import { Capacitor } from '@capacitor/core'
import AppMobile from './AppMobile'

export default function App() {
  // Check if running inside the installed native Android/iOS Capacitor APK
  const isNativeApp = typeof window !== 'undefined' && (
    (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) ||
    window.location.search.includes('mode=native_app')
  );

  // If inside the installed native APK, run the native mobile app
  if (isNativeApp) {
    return <AppMobile />;
  }

  // If in ANY web browser (Desktop, Laptop, Android phone browser, iPhone, Tablet):
  // The website is strictly the AUTHORITY PORTAL with ALL features!
  if (typeof window !== 'undefined') {
    if (!window.location.pathname.includes('desktop.html')) {
      const search = window.location.search || '';
      const hash = window.location.hash || '';
      window.location.replace('./desktop.html' + search + hash);
      return null;
    }
  }

  return null;
}