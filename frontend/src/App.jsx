// Smart device router
// Desktop -> /desktop.html (government NIC-style portal)
// Mobile/Tablet/APK -> React mobile app (AppMobile)

import React from 'react'
import AppMobile from './AppMobile'

function isMobile() {
  return (
    window.innerWidth <= 900 ||
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
  )
}

export default function App() {
  const mobile = isMobile()

  if (!mobile) {
    // Redirect desktop users to the standalone government portal HTML
    window.location.replace('/desktop.html')
    return null
  }

  return <AppMobile />
}