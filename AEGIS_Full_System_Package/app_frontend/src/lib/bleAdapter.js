// ============================================================
// AEGIS BLE P2P Mesh — platform adapter
// Native path: @capgo/capacitor-bluetooth-low-energy (Capacitor 8)
//   The capgo plugin is single-mode per instance, but re-initializing
//   keeps the GATT server + scanner objects alive, so we:
//     1. init peripheral -> addGattService -> startAdvertising
//     2. re-init central  -> scan / connect / write / notify
// Browser path: simulator that runs the REAL mesh relay logic
//   against a virtual neighbor node, so `npm run dev` demos work.
// ============================================================
import { Capacitor } from "@capacitor/core"
import { BluetoothLowEnergy } from "@capgo/capacitor-bluetooth-low-energy"
import {
  AEGIS_SERVICE_UUID,
  RX_CHAR_UUID,
  TX_CHAR_UUID,
  buildFrames,
  makeFrameAssembler,
  createMeshStore,
  randomId,
} from "./bleMesh"

const encoder = new TextEncoder()
const decoder = new TextDecoder()

export function isNative() {
  return typeof Capacitor !== "undefined" && Capacitor.isNativePlatform()
}

const frameToValue = (frame) => Array.from(encoder.encode(JSON.stringify(frame)))
const valueToText = (value) => decoder.decode(new Uint8Array(value))

function parseEnvelope(text) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

// ------------------------------------------------------------------
// NATIVE ADAPTER (real BLE on Android/iOS)
// ------------------------------------------------------------------
export function createNativeMeshAdapter({ mesh, nodeName, onMessage, onLog = () => {} }) {
  let mode = null // last initialize() mode
  let gattServiceAdded = false
  let advertising = false
  let scanning = false
  let busyWith = null // deviceId currently mid-exchange
  const recentSyncs = new Map() // deviceId -> timestamp (cooldown)
  const assembler = makeFrameAssembler()
  const listeners = []

  const log = (msg) => onLog(msg)

  async function ensureMode(m) {
    if (mode === m) return
    await BluetoothLowEnergy.initialize({ mode: m })
    mode = m
  }

  async function requestPermissions() {
    try {
      const status = await BluetoothLowEnergy.checkPermissions()
      const need = status.bluetooth !== "granted" || status.location !== "granted"
      if (need) {
        const req = await BluetoothLowEnergy.requestPermissions()
        return req.bluetooth === "granted" || req.bluetooth === "prompt-with-rationale"
      }
      return true
    } catch (e) {
      log("Permission check failed: " + e.message)
      return false
    }
  }

  const on = (event, fn) => {
    const p = BluetoothLowEnergy.addListener(event, fn)
    listeners.push(p)
    return p
  }

  // ---- peripheral: receive writes on RX, answer on TX ----
  async function handleWriteRequest({ service, characteristic, value }) {
    if (service !== AEGIS_SERVICE_UUID || characteristic !== RX_CHAR_UUID) return
    const frame = parseEnvelope(valueToText(value))
    if (!frame) return
    const payload = assembler.push(frame)
    if (payload === null) return // waiting for more frames
    const envelope = parseEnvelope(payload)
    if (!envelope || !Array.isArray(envelope.msgs)) return
    const res = mesh.receiveRemote(envelope.msgs)
    // Answer: notify our own pending outbox over TX.
    const out = mesh.pendingToSend(12)
    mesh.markDelivered(out.map((m) => m.id))
    for (const f of buildFrames(JSON.stringify({ v: 1, node: mesh.nodeId, msgs: out }))) {
      await BluetoothLowEnergy.notifyGattCharacteristicChanged({
        service: AEGIS_SERVICE_UUID,
        characteristic: TX_CHAR_UUID,
        value: frameToValue(f),
      }).catch(() => {})
    }
    if (res.accepted > 0) onMessage({ received: res.accepted, from: envelope.node || "peer", direction: "in" })
  }

  // ---- central: receive peer's TX notifications ----
  async function handleCharacteristicChanged({ deviceId, service, characteristic, value }) {
    if (service !== AEGIS_SERVICE_UUID || characteristic !== TX_CHAR_UUID) return
    const frame = parseEnvelope(valueToText(value))
    if (!frame) return
    const payload = assembler.push(frame)
    if (payload === null) return
    const envelope = parseEnvelope(payload)
    if (!envelope || !Array.isArray(envelope.msgs)) return
    const res = mesh.receiveRemote(envelope.msgs)
    if (res.accepted > 0) onMessage({ received: res.accepted, from: envelope.node || deviceId, direction: "in" })
  }

  return {
    kind: "native",

    async start() {
      await requestPermissions()
      // --- peripheral role: GATT server + advertising ---
      await ensureMode("peripheral")
      if (!gattServiceAdded) {
        await BluetoothLowEnergy.addGattService({
          service: AEGIS_SERVICE_UUID,
          characteristics: [
            {
              uuid: RX_CHAR_UUID,
              properties: {
                broadcast: false,
                read: false,
                writeWithoutResponse: true,
                write: true,
                notify: false,
                indicate: false,
                authenticatedSignedWrites: false,
                extendedProperties: false,
                reliableWrite: false,
                writableAuxiliaries: false,
              },
            },
            {
              uuid: TX_CHAR_UUID,
              properties: {
                broadcast: false,
                read: false,
                writeWithoutResponse: false,
                write: false,
                notify: true,
                indicate: false,
                authenticatedSignedWrites: false,
                extendedProperties: false,
                reliableWrite: false,
                writableAuxiliaries: false,
              },
            },
          ],
        })
        gattServiceAdded = true
      }
      await BluetoothLowEnergy.startAdvertising({
        name: nodeName,
        services: [AEGIS_SERVICE_UUID],
        includeName: true,
        includeTxPowerLevel: true,
      })
      advertising = true
      // --- central role: re-init keeps the GATT server running ---
      await ensureMode("central")
      if (listeners.length === 0) {
        listeners.push(
          on("gattCharacteristicWriteRequest", handleWriteRequest),
          on("characteristicChanged", handleCharacteristicChanged)
        )
      }
      log("Advertising as " + nodeName + " (AEGIS mesh node live)")
    },

    async startScan(cb) {
      if (scanning) return
      await ensureMode("central")
      scanning = true
      const off = await on("deviceScanned", ({ device }) => {
        if (device && device.deviceId) cb(device)
      })
      await BluetoothLowEnergy.startScan({ services: [AEGIS_SERVICE_UUID], allowDuplicates: false })
      // Auto-stop after 12 s to save battery; devices re-emit on the next scan.
      setTimeout(async () => {
        if (!scanning) return
        await this.stopScan()
      }, 12000)
      return off
    },

    async stopScan() {
      scanning = false
      try {
        await BluetoothLowEnergy.stopScan()
      } catch {
        /* not scanning */
      }
    },

    async connectAndSync(deviceId) {
      if (busyWith) return { ok: false, reason: "Another exchange in progress" }
      const now = Date.now()
      if (now - (recentSyncs.get(deviceId) || 0) < 20000) {
        return { ok: false, reason: "Already synced recently" }
      }
      busyWith = deviceId
      try {
        await ensureMode("central")
        await BluetoothLowEnergy.connect({ deviceId })
        await BluetoothLowEnergy.requestMtu({ deviceId, mtu: 512 })
        await BluetoothLowEnergy.discoverServices({ deviceId })
        await BluetoothLowEnergy.startCharacteristicNotifications({
          deviceId,
          service: AEGIS_SERVICE_UUID,
          characteristic: TX_CHAR_UUID,
        })
        const batch = mesh.pendingToSend(12)
        if (batch.length > 0) {
          for (const f of buildFrames(JSON.stringify({ v: 1, node: mesh.nodeId, msgs: batch }))) {
            await BluetoothLowEnergy.writeCharacteristic({
              deviceId,
              service: AEGIS_SERVICE_UUID,
              characteristic: RX_CHAR_UUID,
              value: frameToValue(f),
              type: "withResponse",
            })
          }
          mesh.markDelivered(batch.map((m) => m.id))
        }
        // Give the peer a moment to push its outbox back over TX.
        await new Promise((r) => setTimeout(r, 800))
        recentSyncs.set(deviceId, Date.now())
        return { ok: true, sent: batch.length }
      } catch (e) {
        return { ok: false, reason: e.message || "Sync failed" }
      } finally {
        try {
          await BluetoothLowEnergy.disconnect({ deviceId })
        } catch {
          /* already disconnected */
        }
        busyWith = null
      }
    },

    async stop() {
      scanning = false
      try {
        await BluetoothLowEnergy.stopScan()
      } catch {}
      try {
        await BluetoothLowEnergy.stopAdvertising()
      } catch {}
      advertising = false
      for (const h of listeners) {
        try {
          await h.remove()
        } catch {}
      }
      listeners.length = 0
    },
  }
}

// ------------------------------------------------------------------
// BROWSER SIMULATOR — runs the real mesh relay logic against a
// virtual neighbor node so the UI can be developed/demoed on a laptop.
// ------------------------------------------------------------------
export function createSimMeshAdapter({ mesh, nodeName, onMessage, onLog = () => {} }) {
  const log = (msg) => onLog(msg)
  let scanning = false

  // A virtual neighbor node carrying messages from a *third* node,
  // so the gossip relay is genuinely exercised in the browser.
  let peerMesh = null

  const SIM_PEERS = [
    { id: "sim-peer-ml-204", name: "Commuter · Tata Sumo (NH-44)", rssi: -54, dist: "14m", hops: 2 },
    { id: "sim-peer-as-8812", name: "Relief Supply Carrier #04", rssi: -72, dist: "29m", hops: 1 },
    { id: "sim-beacon-jh-082", name: "In-Situ Solar Tower Station (BLE)", rssi: -84, dist: "42m", hops: 0 },
  ]

  return {
    kind: "sim",

    async start() {
      peerMesh =
        peerMesh ||
        createMeshStore("PEER-AS-8812", {
          getItem: () => null,
          setItem: () => {},
        })
      // Seed the neighbor with a relayed alert from a third node.
      if (peerMesh.stats().inbox === 0) {
        peerMesh.addMessage({
          type: "alert",
          severity: "CRITICAL",
          zone: "NH-44 Km 48",
          message: "Shale slip blocked the highway. 3 light vehicles stranded. Passengers safe.",
        })
        peerMesh.addMessage({
          type: "info",
          severity: "HIGH",
          zone: "Sohra Escarpment",
          message: "180mm rain in 24h. Watch for debris flow along the cliff road.",
        })
      }
      log("Simulator: node " + nodeName + " online (browser has no BLE radio)")
    },

    async startScan(cb) {
      if (scanning) return
      scanning = true
      await new Promise((r) => setTimeout(r, 1500))
      for (const p of SIM_PEERS) {
        cb({ deviceId: p.id, name: p.name, rssi: p.rssi })
      }
      cb({
        deviceId: "sim-peer-local-" + Math.floor(100 + Math.random() * 899),
        name: "Nearby Citizen Phone (AEGIS Peer)",
        rssi: -(60 + Math.floor(Math.random() * 9)),
      })
      await new Promise((r) => setTimeout(r, 300))
      scanning = false
    },

    async stopScan() {
      scanning = false
    },

    async connectAndSync(deviceId) {
      if (!deviceId) return { ok: false, reason: "No peer" }
      const peerName = SIM_PEERS.find((p) => p.id === deviceId)?.name || "Sim Peer"
      const peer =
        peerName === "In-Situ Solar Tower Station (BLE)"
          ? peerMesh // beacon carries the seed alerts
          : createMeshStore("sim-vehicle-" + deviceId, { getItem: () => null, setItem: () => {} })

      // outbound: our outbox -> peer
      const ourBatch = mesh.pendingToSend(12)
      if (ourBatch.length > 0) {
        peer.receiveRemote(ourBatch)
        mesh.markDelivered(ourBatch.map((m) => m.id))
      }
      // inbound: peer's outbox -> us
      const peerBatch = peer.pendingToSend(12)
      let accepted = 0
      if (peerBatch.length > 0) {
        const res = mesh.receiveRemote(peerBatch)
        accepted = res.accepted
        peer.markDelivered(peerBatch.map((m) => m.id))
        if (accepted > 0) onMessage({ received: accepted, from: "PEER-AS-8812", direction: "in" })
      }
      return { ok: true, sent: ourBatch.length, received: accepted, peer: peerName }
    },

    async stop() {
      scanning = false
    },
  }
}

// ------------------------------------------------------------------
// Factory
// ------------------------------------------------------------------
export function createMeshAdapter(options) {
  return isNative()
    ? createNativeMeshAdapter(options)
    : createSimMeshAdapter(options)
}

export { randomId }