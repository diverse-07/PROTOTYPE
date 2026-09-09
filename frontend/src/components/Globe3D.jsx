import React, { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'

// Mathematical conversion of (lat, lng) to Three.js Vector3 on a sphere of given radius
export function latLngToVector3(lat, lng, radius, out = new THREE.Vector3()) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  out.x = -radius * Math.sin(phi) * Math.cos(theta)
  out.y = radius * Math.cos(phi)
  out.z = radius * Math.sin(phi) * Math.sin(theta)
  return out
}

export default function Globe3D({
  userLocation,
  zones = [],
  sensors = [],
  focusTarget, // { lat, lng, zoom: boolean }
  autoRotate = true,
  cloudsEnabled = true,
  nightMode = false,
  onZoneSelect,
  isZoomedIn = false,
  onResetOrbit
}) {
  const containerRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const cameraRef = useRef(null)
  const globeGroupRef = useRef(null)
  const cloudsMeshRef = useRef(null)
  const userPinGroupRef = useRef(null)
  const zonePinsGroupRef = useRef(null)
  const animationFrameIdRef = useRef(null)

  // Camera animation state
  const cameraAnimRef = useRef({
    animating: false,
    startPos: new THREE.Vector3(),
    targetPos: new THREE.Vector3(),
    startLookAt: new THREE.Vector3(),
    targetLookAt: new THREE.Vector3(),
    startTime: 0,
    duration: 1600
  })

  // User drag interaction state
  const interactionRef = useRef({
    isDragging: false,
    prevMouseX: 0,
    prevMouseY: 0,
    rotSpeedX: 0.003,
    rotSpeedY: 0.003,
    velX: 0,
    velY: 0,
    targetDistance: 5.2,
    currentDistance: 5.2,
    minDistance: 2.35, // close orbit
    maxDistance: 9.0
  })

  const [hoveredEntity, setHoveredEntity] = useState(null)
  const [textureStatus, setTextureStatus] = useState('loading')

  // Initialize Three.js Scene
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const width = container.clientWidth || window.innerWidth
    const height = container.clientHeight || window.innerHeight

    // 1. Scene
    const scene = new THREE.Scene()
    sceneRef.current = scene

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    camera.position.set(0, 1.2, 5.2)
    cameraRef.current = camera

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.15
    container.replaceChildren(renderer.domElement)
    rendererRef.current = renderer

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85)
    scene.add(ambientLight)

    const sunLight = new THREE.DirectionalLight(0xfffaed, 2.0)
    sunLight.position.set(10, 6, 8)
    scene.add(sunLight)

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.2)
    rimLight.position.set(-10, -4, -6)
    scene.add(rimLight)

    // 5. Deep Space Starfield
    const starsCount = 1400
    const starsGeo = new THREE.BufferGeometry()
    const starPositions = new Float32Array(starsCount * 3)
    const starColors = new Float32Array(starsCount * 3)

    for (let i = 0; i < starsCount; i++) {
      const r = 40 + Math.random() * 40
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      starPositions[i * 3 + 2] = r * Math.cos(phi)

      const colorMix = Math.random()
      starColors[i * 3] = colorMix > 0.8 ? 0.6 : 0.9
      starColors[i * 3 + 1] = colorMix > 0.8 ? 0.8 : 0.95
      starColors[i * 3 + 2] = 1.0
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))
    starsGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3))
    const starsMat = new THREE.PointsMaterial({
      size: 0.28,
      vertexColors: true,
      transparent: true,
      opacity: 0.75
    })
    const starField = new THREE.Points(starsGeo, starsMat)
    scene.add(starField)

    // 6. Master Globe Group
    const globeGroup = new THREE.Group()
    scene.add(globeGroup)
    globeGroupRef.current = globeGroup

    const GLOBE_RADIUS = 2.0
    const globeGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64)

    // Texture Loader
    const textureLoader = new THREE.TextureLoader()

    const dayTex = textureLoader.load(
      './textures/earth_day.jpg',
      () => setTextureStatus('ready'),
      undefined,
      () => {
        console.warn('[AEGIS] Local texture load fallback')
        setTextureStatus('fallback')
      }
    )
    const normalTex = textureLoader.load('./textures/earth_normal.jpg')
    const specTex = textureLoader.load('./textures/earth_specular.jpg')

    const globeMat = new THREE.MeshPhongMaterial({
      map: dayTex,
      bumpMap: normalTex,
      bumpScale: 0.04,
      specularMap: specTex,
      specular: new THREE.Color(0x224466),
      shininess: 12
    })
    const globeMesh = new THREE.Mesh(globeGeo, globeMat)
    globeGroup.add(globeMesh)

    // 7. Atmospheric Glow Shader (Fresnel outer halo)
    const atmosVertexShader = `
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `
    const atmosFragmentShader = `
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vec3 viewDir = normalize(-vPosition);
        float intensity = pow(0.68 - dot(vNormal, viewDir), 2.2);
        gl_FragColor = vec4(0.12, 0.65, 1.0, intensity * 0.95);
      }
    `
    const atmosMat = new THREE.ShaderMaterial({
      vertexShader: atmosVertexShader,
      fragmentShader: atmosFragmentShader,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false
    })
    const atmosMesh = new THREE.Mesh(new THREE.SphereGeometry(GLOBE_RADIUS * 1.15, 48, 48), atmosMat)
    scene.add(atmosMesh)

    // 8. Animated Cloud Layer
    const cloudsTex = textureLoader.load('./textures/earth_clouds.jpg')
    const cloudsMat = new THREE.MeshStandardMaterial({
      map: cloudsTex,
      transparent: true,
      opacity: 0.38,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
    const cloudsMesh = new THREE.Mesh(new THREE.SphereGeometry(GLOBE_RADIUS * 1.012, 48, 48), cloudsMat)
    globeGroup.add(cloudsMesh)
    cloudsMeshRef.current = cloudsMesh

    // 9. Groups for Pins & Markers
    const zonePinsGroup = new THREE.Group()
    globeGroup.add(zonePinsGroup)
    zonePinsGroupRef.current = zonePinsGroup

    const userPinGroup = new THREE.Group()
    globeGroup.add(userPinGroup)
    userPinGroupRef.current = userPinGroup

    // 10. Initial rotation oriented toward India (NER ~ 25°N, 92°E)
    globeGroup.rotation.y = -Math.PI * 0.45
    globeGroup.rotation.x = 0.22

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return
      const w = containerRef.current.clientWidth
      const h = containerRef.current.clientHeight
      cameraRef.current.aspect = w / h
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    // Interaction Handlers (Mouse / Touch)
    const onMouseDown = (e) => {
      interactionRef.current.isDragging = true
      interactionRef.current.prevMouseX = e.clientX
      interactionRef.current.prevMouseY = e.clientY
    }
    const onMouseMove = (e) => {
      if (!interactionRef.current.isDragging || !globeGroupRef.current) return
      const deltaX = e.clientX - interactionRef.current.prevMouseX
      const deltaY = e.clientY - interactionRef.current.prevMouseY
      interactionRef.current.prevMouseX = e.clientX
      interactionRef.current.prevMouseY = e.clientY

      interactionRef.current.velX = deltaX * interactionRef.current.rotSpeedX
      interactionRef.current.velY = deltaY * interactionRef.current.rotSpeedY

      globeGroupRef.current.rotation.y += interactionRef.current.velX
      globeGroupRef.current.rotation.x = Math.max(
        -Math.PI / 2.2,
        Math.min(Math.PI / 2.2, globeGroupRef.current.rotation.x + interactionRef.current.velY)
      )
    }
    const onMouseUp = () => {
      interactionRef.current.isDragging = false
    }
    const onWheel = (e) => {
      e.preventDefault()
      const zoomDelta = e.deltaY * 0.003
      interactionRef.current.targetDistance = Math.max(
        interactionRef.current.minDistance,
        Math.min(interactionRef.current.maxDistance, interactionRef.current.targetDistance + zoomDelta)
      )
    }

    const domEl = renderer.domElement
    domEl.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    domEl.addEventListener('wheel', onWheel, { passive: false })

    // Touch support
    let touchStartDist = 0
    const onTouchStart = (e) => {
      if (e.touches.length === 1) {
        interactionRef.current.isDragging = true
        interactionRef.current.prevMouseX = e.touches[0].clientX
        interactionRef.current.prevMouseY = e.touches[0].clientY
      } else if (e.touches.length === 2) {
        touchStartDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        )
      }
    }
    const onTouchMove = (e) => {
      if (e.touches.length === 1 && interactionRef.current.isDragging && globeGroupRef.current) {
        const deltaX = e.touches[0].clientX - interactionRef.current.prevMouseX
        const deltaY = e.touches[0].clientY - interactionRef.current.prevMouseY
        interactionRef.current.prevMouseX = e.touches[0].clientX
        interactionRef.current.prevMouseY = e.touches[0].clientY

        globeGroupRef.current.rotation.y += deltaX * 0.004
        globeGroupRef.current.rotation.x = Math.max(
          -Math.PI / 2.2,
          Math.min(Math.PI / 2.2, globeGroupRef.current.rotation.x + deltaY * 0.004)
        )
      } else if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        )
        const factor = (touchStartDist - dist) * 0.008
        interactionRef.current.targetDistance = Math.max(
          interactionRef.current.minDistance,
          Math.min(interactionRef.current.maxDistance, interactionRef.current.targetDistance + factor)
        )
        touchStartDist = dist
      }
    }
    const onTouchEnd = () => {
      interactionRef.current.isDragging = false
    }

    domEl.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd)

    // Animation Loop
    let lastTime = performance.now()
    const animate = (time) => {
      animationFrameIdRef.current = requestAnimationFrame(animate)
      const delta = (time - lastTime) / 1000
      lastTime = time

      // 1. Damping inertia on rotation
      if (!interactionRef.current.isDragging && globeGroupRef.current) {
        interactionRef.current.velX *= 0.94
        interactionRef.current.velY *= 0.94
        globeGroupRef.current.rotation.y += interactionRef.current.velX
        globeGroupRef.current.rotation.x = Math.max(
          -Math.PI / 2.2,
          Math.min(Math.PI / 2.2, globeGroupRef.current.rotation.x + interactionRef.current.velY)
        )

        // Subtle continuous auto-rotation if idle
        if (autoRotate && !cameraAnimRef.current.animating && Math.abs(interactionRef.current.velX) < 0.0001) {
          globeGroupRef.current.rotation.y += 0.0008
        }
      }

      // 2. Cloud rotation
      if (cloudsMeshRef.current && cloudsEnabled) {
        cloudsMeshRef.current.rotation.y += 0.0012
      }

      // 3. Smooth Camera distance zoom
      if (!cameraAnimRef.current.animating && cameraRef.current) {
        interactionRef.current.currentDistance +=
          (interactionRef.current.targetDistance - interactionRef.current.currentDistance) * 0.08
        const dir = cameraRef.current.position.clone().normalize()
        cameraRef.current.position.copy(dir.multiplyScalar(interactionRef.current.currentDistance))
      }

      // 4. Smooth Camera Fly-To animation (Interpolation)
      if (cameraAnimRef.current.animating && cameraRef.current) {
        const elapsed = performance.now() - cameraAnimRef.current.startTime
        const progress = Math.min(1.0, elapsed / cameraAnimRef.current.duration)

        // Ease in-out cubic
        const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2

        cameraRef.current.position.lerpVectors(cameraAnimRef.current.startPos, cameraAnimRef.current.targetPos, ease)

        const curLookAt = new THREE.Vector3().lerpVectors(
          cameraAnimRef.current.startLookAt,
          cameraAnimRef.current.targetLookAt,
          ease
        )
        cameraRef.current.lookAt(curLookAt)

        if (progress >= 1.0) {
          cameraAnimRef.current.animating = false
          interactionRef.current.targetDistance = cameraRef.current.position.length()
          interactionRef.current.currentDistance = interactionRef.current.targetDistance
        }
      }

      // 5. Pulsing rings animation on 3D pins
      const pulseTime = time * 0.002
      if (zonePinsGroupRef.current) {
        zonePinsGroupRef.current.children.forEach((group) => {
          const ring = group.getObjectByName('pulseRing')
          if (ring) {
            const s = 1.0 + (Math.sin(pulseTime * 2.5 + (group.userData.id || 0)) * 0.5 + 0.5) * 0.8
            ring.scale.set(s, s, s)
            ring.material.opacity = 0.85 - (s - 1.0) * 0.7
          }
        })
      }

      // User beacon pulse
      if (userPinGroupRef.current) {
        const userBeacon = userPinGroupRef.current.getObjectByName('userRadarRing')
        if (userBeacon) {
          const s = 1.0 + ((pulseTime * 3) % 1.0) * 2.2
          userBeacon.scale.set(s, s, s)
          userBeacon.material.opacity = Math.max(0, 1.0 - (s - 1.0) / 2.2)
        }
      }

      renderer.render(scene, camera)
    }

    animationFrameIdRef.current = requestAnimationFrame(animate)

    // Cleanup
    return () => {
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
      domEl.removeEventListener('mousedown', onMouseDown)
      domEl.removeEventListener('wheel', onWheel)
      domEl.removeEventListener('touchstart', onTouchStart)
      renderer.dispose()
    }
  }, [])

  // Update Zone Pins on Globe
  useEffect(() => {
    const group = zonePinsGroupRef.current
    if (!group) return
    group.clear()

    const GLOBE_RADIUS = 2.0

    zones.forEach((zone) => {
      const pinGroup = new THREE.Group()
      pinGroup.userData = zone

      // Position on sphere
      const lat = zone.lat || zone.coords?.[0]?.[0] || 25.5
      const lng = zone.lng || zone.coords?.[0]?.[1] || 92.5
      const pos = latLngToVector3(lat, lng, GLOBE_RADIUS + 0.01)
      pinGroup.position.copy(pos)

      // Align pin group to point normal to the sphere surface
      pinGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pos.clone().normalize())

      // Color based on risk
      let colorHex = 0x22c55e // green
      const score = zone.score || 50
      if (score >= 80) colorHex = 0xef4444 // red
      else if (score >= 65) colorHex = 0xf97316 // orange
      else if (score >= 45) colorHex = 0xeab308 // yellow
      else if (score >= 25) colorHex = 0x84cc16

      // Base Pin Core Dot
      const coreMat = new THREE.MeshBasicMaterial({ color: colorHex })
      const coreMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.005, 0.04, 16), coreMat)
      coreMesh.position.y = 0.02
      pinGroup.add(coreMesh)

      // Pulsing Radar Ring
      const ringGeo = new THREE.RingGeometry(0.02, 0.045, 24)
      ringGeo.rotateX(-Math.PI / 2)
      const ringMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
      })
      const ringMesh = new THREE.Mesh(ringGeo, ringMat)
      ringMesh.name = 'pulseRing'
      ringMesh.position.y = 0.005
      pinGroup.add(ringMesh)

      group.add(pinGroup)
    })
  }, [zones])

  // Update Live User Location Pin & Radar Beacon
  useEffect(() => {
    const userGroup = userPinGroupRef.current
    if (!userGroup) return
    userGroup.clear()

    if (!userLocation || !userLocation.lat || !userLocation.lng) return

    const GLOBE_RADIUS = 2.0
    const pos = latLngToVector3(userLocation.lat, userLocation.lng, GLOBE_RADIUS + 0.01)

    const beaconGroup = new THREE.Group()
    beaconGroup.position.copy(pos)
    beaconGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pos.clone().normalize())

    // 1. Glowing vertical light pillar beam pointing into space
    const beamGeo = new THREE.CylinderGeometry(0.008, 0.022, 0.28, 16)
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.85
    })
    const beamMesh = new THREE.Mesh(beamGeo, beamMat)
    beamMesh.position.y = 0.14
    beaconGroup.add(beamMesh)

    // 2. Center bright core orb
    const orbGeo = new THREE.SphereGeometry(0.026, 16, 16)
    const orbMat = new THREE.MeshBasicMaterial({ color: 0xffffff })
    const orbMesh = new THREE.Mesh(orbGeo, orbMat)
    orbMesh.position.y = 0.28
    beaconGroup.add(orbMesh)

    // 3. Radar ripple wave rings
    const ringGeo = new THREE.RingGeometry(0.025, 0.065, 32)
    ringGeo.rotateX(-Math.PI / 2)
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9
    })
    const ringMesh = new THREE.Mesh(ringGeo, ringMat)
    ringMesh.name = 'userRadarRing'
    ringMesh.position.y = 0.008
    beaconGroup.add(ringMesh)

    userGroup.add(beaconGroup)
  }, [userLocation])

  // Smooth Camera Fly-To Interpolation (Zoom into Coordinates)
  const flyTo = useCallback((lat, lng, closeZoom = true) => {
    if (!cameraRef.current || !globeGroupRef.current) return

    const GLOBE_RADIUS = 2.0
    const targetDistance = closeZoom ? 2.55 : 5.2

    const localTarget = latLngToVector3(lat, lng, GLOBE_RADIUS)
    const worldTarget = localTarget.clone().applyEuler(globeGroupRef.current.rotation)

    const targetCamPos = worldTarget.clone().normalize().multiplyScalar(targetDistance)

    cameraAnimRef.current = {
      animating: true,
      startPos: cameraRef.current.position.clone(),
      targetPos: targetCamPos,
      startLookAt: new THREE.Vector3(0, 0, 0),
      targetLookAt: worldTarget.clone().multiplyScalar(0.2),
      startTime: performance.now(),
      duration: closeZoom ? 1800 : 1200
    }
  }, [])

  // Trigger flyTo when focusTarget changes
  useEffect(() => {
    if (focusTarget && focusTarget.lat !== undefined && focusTarget.lng !== undefined) {
      flyTo(focusTarget.lat, focusTarget.lng, focusTarget.zoom !== false)
    }
  }, [focusTarget, flyTo])

  // Raycasting for interactive click & hover on zones
  const handleClick = (e) => {
    if (!containerRef.current || !cameraRef.current || !zonePinsGroupRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    )

    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(mouse, cameraRef.current)

    const intersects = raycaster.intersectObjects(zonePinsGroupRef.current.children, true)
    if (intersects.length > 0) {
      let root = intersects[0].object
      while (root.parent && root.parent !== zonePinsGroupRef.current) {
        root = root.parent
      }
      if (root && root.userData && onZoneSelect) {
        onZoneSelect(root.userData)
      }
    }
  }

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        cursor: interactionRef.current.isDragging ? 'grabbing' : 'grab'
      }}
    >
      {textureStatus === 'loading' && (
        <div
          style={{
            position: 'absolute',
            bottom: '90px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(10, 14, 23, 0.8)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '30px',
            padding: '8px 18px',
            color: '#94a3b8',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 10
          }}
        >
          <span className='live-dot' style={{ background: '#00f0ff' }}></span>
          <span>Loading NASA Surface Radar Telemetry...</span>
        </div>
      )}
    </div>
  )
}
