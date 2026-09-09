import React, { useEffect, useRef, useState, useCallback } from "react"
import * as THREE from "three"

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
  focusTarget,
  autoRotate = true,
  onZoneSelect,
  isZoomedIn = false
}) {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const cameraRef = useRef(null)
  const globeGroupRef = useRef(null)
  const earthMeshRef = useRef(null)
  const cloudsMeshRef = useRef(null)
  const userPinGroupRef = useRef(null)
  const zonePinsGroupRef = useRef(null)
  const animationFrameIdRef = useRef(null)
  const sunDirRef = useRef(new THREE.Vector3(4.0, 1.8, 3.5).normalize())

  // Camera animation state
  const cameraAnimRef = useRef({
    animating: false,
    startPos: new THREE.Vector3(),
    targetPos: new THREE.Vector3(),
    startLookAt: new THREE.Vector3(),
    targetLookAt: new THREE.Vector3(),
    startTime: 0,
    duration: 1800
  })

  // User drag interaction state (locked to realistic vertical bounds)
  const interactionRef = useRef({
    isDragging: false,
    prevMouseX: 0,
    prevMouseY: 0,
    rotSpeedX: 0.0025,
    rotSpeedY: 0.0015,
    velX: 0,
    velY: 0,
    targetDistance: 5.2,
    currentDistance: 5.2,
    minDistance: 2.35,
    maxDistance: 8.5
  })

  const [textureStatus, setTextureStatus] = useState("loading")

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const width = container.clientWidth || window.innerWidth
    const height = container.clientHeight || window.innerHeight

    // 1. Scene
    const scene = new THREE.Scene()
    sceneRef.current = scene

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / Math.max(height, 1), 0.1, 1000)
    camera.position.set(0, 0.8, 5.2)
    cameraRef.current = camera

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    })
    renderer.setSize(width, height, false)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    rendererRef.current = renderer

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.35)
    scene.add(ambientLight)

    // 5. Deep Space Stars (tiny, realistic, crisp pinpoints)
    const starsCount = 1800
    const starsGeo = new THREE.BufferGeometry()
    const starPositions = new Float32Array(starsCount * 3)
    const starOpacities = new Float32Array(starsCount)

    for (let i = 0; i < starsCount; i++) {
      const r = 50 + Math.random() * 50
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      starPositions[i * 3 + 2] = r * Math.cos(phi)
      starOpacities[i] = 0.4 + Math.random() * 0.5
    }
    starsGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3))
    const starsMat = new THREE.PointsMaterial({
      size: 0.18,
      color: 0xe2e8f0,
      transparent: true,
      opacity: 0.85
    })
    const starField = new THREE.Points(starsGeo, starsMat)
    scene.add(starField)

    // 6. Master Globe Group
    const globeGroup = new THREE.Group()
    scene.add(globeGroup)
    globeGroupRef.current = globeGroup

    const GLOBE_RADIUS = 2.0
    const globeGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 96, 96)

    // Texture Loader
    const textureLoader = new THREE.TextureLoader()

    const dayTex = textureLoader.load(
      "./textures/earth_day.jpg",
      () => setTextureStatus("ready"),
      undefined,
      () => setTextureStatus("fallback")
    )
    dayTex.colorSpace = THREE.SRGBColorSpace

    const nightTex = textureLoader.load("./textures/earth_night.jpg")
    nightTex.colorSpace = THREE.SRGBColorSpace

    const cloudsTex = textureLoader.load("./textures/earth_clouds.jpg")
    cloudsTex.colorSpace = THREE.SRGBColorSpace

    const specTex = textureLoader.load("./textures/earth_specular.jpg")

    // 7. PHOTOREALISTIC ISS-GRADE EARTH SHADER
    // Blends Day Marble + Specular Oceans + Warm Golden Night City Lights + Delicate Horizon Limb Airglow
    const earthVertexShader = `
      varying vec3 vNormal;
      varying vec2 vUv;
      varying vec3 vWorldPosition;
      varying vec3 vViewPosition;

      void main() {
        vNormal = normalize(normalMatrix * normal);
        vUv = uv;
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPos.xyz;
        vec4 viewPos = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = viewPos.xyz;
        gl_Position = projectionMatrix * viewPos;
      }
    `

    const earthFragmentShader = `
      uniform sampler2D dayTexture;
      uniform sampler2D nightTexture;
      uniform sampler2D specularTexture;
      uniform vec3 uSunDirection;

      varying vec3 vNormal;
      varying vec2 vUv;
      varying vec3 vWorldPosition;
      varying vec3 vViewPosition;

      void main() {
        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(-vViewPosition);

        // Angle between surface normal and sunlight in camera space
        float sunDot = dot(normal, normalize(uSunDirection));

        // Sample textures
        vec3 dayCol = texture2D(dayTexture, vUv).rgb;
        vec3 nightCol = texture2D(nightTexture, vUv).rgb;
        float specMask = texture2D(specularTexture, vUv).r;

        // Rich warm amber city lights on night side (like ISS photograph)
        vec3 cityLights = nightCol * vec3(1.35, 1.15, 0.75) * 1.8;

        // Smooth transition between day and night (terminator line)
        float dayFactor = smoothstep(-0.12, 0.18, sunDot);

        // Ocean specular reflection (sun glint)
        vec3 halfVec = normalize(normalize(uSunDirection) + viewDir);
        float spec = pow(max(0.0, dot(normal, halfVec)), 28.0) * specMask * 0.45;
        vec3 illuminatedDay = (dayCol * max(0.04, sunDot) + vec3(spec));

        // Subtle realistic horizon airglow (thin delicate blue/cyan limb)
        float rim = 1.0 - max(0.0, dot(normal, viewDir));
        float thinLimb = pow(rim, 6.5) * 1.5;
        vec3 limbColor = vec3(0.2, 0.58, 0.98) * thinLimb;

        // Combine night city lights with day terrain
        vec3 surface = mix(cityLights, illuminatedDay, dayFactor);

        // Add delicate atmospheric horizon scattering
        vec3 finalColor = surface + (limbColor * 0.75 * dayFactor) + (limbColor * 0.18 * (1.0 - dayFactor));

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `

    const earthMat = new THREE.ShaderMaterial({
      vertexShader: earthVertexShader,
      fragmentShader: earthFragmentShader,
      uniforms: {
        dayTexture: { value: dayTex },
        nightTexture: { value: nightTex },
        specularTexture: { value: specTex },
        uSunDirection: { value: sunDirRef.current }
      }
    })

    const earthMesh = new THREE.Mesh(globeGeo, earthMat)
    globeGroup.add(earthMesh)
    earthMeshRef.current = earthMesh

    // 8. Realistic Thin Cloud Layer (soft, drifting slowly)
    const cloudsMat = new THREE.MeshStandardMaterial({
      map: cloudsTex,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
    const cloudsMesh = new THREE.Mesh(new THREE.SphereGeometry(GLOBE_RADIUS * 1.006, 64, 64), cloudsMat)
    globeGroup.add(cloudsMesh)
    cloudsMeshRef.current = cloudsMesh

    // 9. Groups for Classic Minimalist Pins
    const zonePinsGroup = new THREE.Group()
    globeGroup.add(zonePinsGroup)
    zonePinsGroupRef.current = zonePinsGroup

    const userPinGroup = new THREE.Group()
    globeGroup.add(userPinGroup)
    userPinGroupRef.current = userPinGroup

    // Initial orientation: Centered on India / Asian continent with a majestic angle
    globeGroup.rotation.y = -Math.PI * 0.44
    globeGroup.rotation.x = 0.12

    // ResizeObserver
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width
        const h = entry.contentRect.height
        if (w > 0 && h > 0 && cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect = w / h
          cameraRef.current.updateProjectionMatrix()
          rendererRef.current.setSize(w, h, false)
        }
      }
    })
    resizeObserver.observe(container)

    // Interaction Handlers (Locked vertical pitch so Earth stays upright!)
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
      // CLAMP VERTICAL TILT TO REALISTIC BOUNDS (-18 deg to +22 deg)
      globeGroupRef.current.rotation.x = Math.max(
        -0.28,
        Math.min(0.35, globeGroupRef.current.rotation.x + interactionRef.current.velY)
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

    canvas.addEventListener("mousedown", onMouseDown)
    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup", onMouseUp)
    canvas.addEventListener("wheel", onWheel, { passive: false })

    // Touch support for phones
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

        globeGroupRef.current.rotation.y += deltaX * 0.003
        globeGroupRef.current.rotation.x = Math.max(
          -0.28,
          Math.min(0.35, globeGroupRef.current.rotation.x + deltaY * 0.0018)
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

    canvas.addEventListener("touchstart", onTouchStart, { passive: true })
    window.addEventListener("touchmove", onTouchMove, { passive: true })
    window.addEventListener("touchend", onTouchEnd)

    // Animation Loop
    let lastTime = performance.now()
    const animate = (time) => {
      animationFrameIdRef.current = requestAnimationFrame(animate)
      const delta = (time - lastTime) / 1000
      lastTime = time

      // Gentle damping
      if (!interactionRef.current.isDragging && globeGroupRef.current) {
        interactionRef.current.velX *= 0.93
        interactionRef.current.velY *= 0.93
        globeGroupRef.current.rotation.y += interactionRef.current.velX
        globeGroupRef.current.rotation.x = Math.max(
          -0.28,
          Math.min(0.35, globeGroupRef.current.rotation.x + interactionRef.current.velY)
        )

        // Slow cinematic planetary rotation
        if (autoRotate && !cameraAnimRef.current.animating && Math.abs(interactionRef.current.velX) < 0.0001) {
          globeGroupRef.current.rotation.y += 0.0005
        }
      }

      // Cloud drift
      if (cloudsMeshRef.current) {
        cloudsMeshRef.current.rotation.y += 0.0008
      }

      // Smooth camera distance
      if (!cameraAnimRef.current.animating && cameraRef.current) {
        interactionRef.current.currentDistance +=
          (interactionRef.current.targetDistance - interactionRef.current.currentDistance) * 0.08
        const dir = cameraRef.current.position.clone().normalize()
        cameraRef.current.position.copy(dir.multiplyScalar(interactionRef.current.currentDistance))
      }

      // Smooth fly-to
      if (cameraAnimRef.current.animating && cameraRef.current) {
        const elapsed = performance.now() - cameraAnimRef.current.startTime
        const progress = Math.min(1.0, elapsed / cameraAnimRef.current.duration)
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

      // Subtle pulse on pins (minimal, non-flashy)
      const pulseTime = time * 0.0015
      if (zonePinsGroupRef.current) {
        zonePinsGroupRef.current.children.forEach((group) => {
          const halo = group.getObjectByName("subtleHalo")
          if (halo) {
            const s = 1.0 + (Math.sin(pulseTime * 2.0 + (group.userData.id || 0)) * 0.5 + 0.5) * 0.35
            halo.scale.set(s, s, s)
            halo.material.opacity = 0.35 - (s - 1.0) * 0.4
          }
        })
      }

      renderer.render(scene, camera)
    }

    animationFrameIdRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current)
      resizeObserver.disconnect()
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", onMouseUp)
      window.removeEventListener("touchmove", onTouchMove)
      window.removeEventListener("touchend", onTouchEnd)
      canvas.removeEventListener("mousedown", onMouseDown)
      canvas.removeEventListener("wheel", onWheel)
      canvas.removeEventListener("touchstart", onTouchStart)
      renderer.dispose()
    }
  }, [])

  // Update Zone Pins (Classic Minimalist Dots with Hairline Ring)
  useEffect(() => {
    const group = zonePinsGroupRef.current
    if (!group) return
    group.clear()

    const GLOBE_RADIUS = 2.0

    zones.forEach((zone) => {
      const pinGroup = new THREE.Group()
      pinGroup.userData = zone

      const lat = zone.lat || zone.coords?.[0]?.[0] || 25.5
      const lng = zone.lng || zone.coords?.[0]?.[1] || 92.5
      const pos = latLngToVector3(lat, lng, GLOBE_RADIUS + 0.003)
      pinGroup.position.copy(pos)
      pinGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pos.clone().normalize())

      // Classic, subtle pinpoint dot (warm amber / crisp white / subtle crimson)
      const score = zone.score || 50
      let pinColor = 0xf59e0b // amber
      if (score >= 80) pinColor = 0xef4444 // crimson
      else if (score >= 65) pinColor = 0xf97316 // orange
      else if (score < 30) pinColor = 0x10b981 // emerald

      // 1. Tiny sharp central bead
      const beadGeo = new THREE.SphereGeometry(0.012, 12, 12)
      const beadMat = new THREE.MeshBasicMaterial({ color: pinColor })
      const beadMesh = new THREE.Mesh(beadGeo, beadMat)
      beadMesh.position.y = 0.008
      pinGroup.add(beadMesh)

      // 2. Delicate hairline boundary ring (0.5px subtle halo)
      const haloGeo = new THREE.RingGeometry(0.014, 0.022, 24)
      haloGeo.rotateX(-Math.PI / 2)
      const haloMat = new THREE.MeshBasicMaterial({
        color: pinColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.35
      })
      const haloMesh = new THREE.Mesh(haloGeo, haloMat)
      haloMesh.name = "subtleHalo"
      haloMesh.position.y = 0.003
      pinGroup.add(haloMesh)

      group.add(pinGroup)
    })
  }, [zones])

  // Update Live User Location Pin (Classic Subtle Cyan Pinpoint)
  useEffect(() => {
    const userGroup = userPinGroupRef.current
    if (!userGroup) return
    userGroup.clear()

    if (!userLocation || !userLocation.lat || !userLocation.lng) return

    const GLOBE_RADIUS = 2.0
    const pos = latLngToVector3(userLocation.lat, userLocation.lng, GLOBE_RADIUS + 0.004)

    const beaconGroup = new THREE.Group()
    beaconGroup.position.copy(pos)
    beaconGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pos.clone().normalize())

    // 1. Tiny crisp white core bead
    const coreGeo = new THREE.SphereGeometry(0.016, 16, 16)
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff })
    const coreMesh = new THREE.Mesh(coreGeo, coreMat)
    coreMesh.position.y = 0.01
    beaconGroup.add(coreMesh)

    // 2. Subtle cyan ring
    const ringGeo = new THREE.RingGeometry(0.02, 0.03, 32)
    ringGeo.rotateX(-Math.PI / 2)
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6
    })
    const ringMesh = new THREE.Mesh(ringGeo, ringMat)
    ringMesh.position.y = 0.004
    beaconGroup.add(ringMesh)

    userGroup.add(beaconGroup)
  }, [userLocation])

  // Camera Fly-To Interpolation
  const flyTo = useCallback((lat, lng, closeZoom = true) => {
    if (!cameraRef.current || !globeGroupRef.current) return

    const GLOBE_RADIUS = 2.0
    const targetDistance = closeZoom ? 2.65 : 5.2

    const localTarget = latLngToVector3(lat, lng, GLOBE_RADIUS)
    const worldTarget = localTarget.clone().applyEuler(globeGroupRef.current.rotation)
    const targetCamPos = worldTarget.clone().normalize().multiplyScalar(targetDistance)

    cameraAnimRef.current = {
      animating: true,
      startPos: cameraRef.current.position.clone(),
      targetPos: targetCamPos,
      startLookAt: new THREE.Vector3(0, 0, 0),
      targetLookAt: worldTarget.clone().multiplyScalar(0.15),
      startTime: performance.now(),
      duration: closeZoom ? 1800 : 1200
    }
  }, [])

  useEffect(() => {
    if (focusTarget && focusTarget.lat !== undefined && focusTarget.lng !== undefined) {
      flyTo(focusTarget.lat, focusTarget.lng, focusTarget.zoom !== false)
    }
  }, [focusTarget, flyTo])

  const handleClick = (e) => {
    if (!canvasRef.current || !cameraRef.current || !zonePinsGroupRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
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
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden"
      }}
    >
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          cursor: interactionRef.current.isDragging ? "grabbing" : "grab"
        }}
      />
    </div>
  )
}
