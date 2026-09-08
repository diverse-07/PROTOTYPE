// ============================================================
// AEGIS mesh runtime — one store + one adapter for the whole app
// Shared by the SOS broadcast modal and the Offline Disaster Portal.
// ============================================================
import { createMeshStore } from "./bleMesh"
import { createMeshAdapter } from "./bleAdapter"

let store = null
let adapter = null
let adapterOptions = null // { nodeName, onMessage, onLog }

export function getMeshStore(nodeId) {
  if (!store || (nodeId && store.nodeId !== nodeId)) {
    store = createMeshStore(nodeId || "NER-NODE-0000")
  }
  return store
}

export function getMeshAdapter() {
  if (!adapter && adapterOptions) {
    adapter = createMeshAdapter({ mesh: getMeshStore(), ...adapterOptions })
  }
  return adapter
}

/** Start the mesh (idempotent). nodeId drives identity + persistence. */
export async function startMesh({ nodeId, onMessage, onLog = () => {} }) {
  getMeshStore(nodeId)
  const nextOptions = { nodeName: "AEGIS-" + String(nodeId || "NODE").slice(-4), onMessage, onLog }
  // Node identity changed (sign-out / switch user): tear down and rebuild
  // so the advertising name + store line up.
  if (adapter && adapterOptions && adapterOptions.nodeName !== nextOptions.nodeName) {
    await stopMesh()
  }
  adapterOptions = nextOptions
  if (!adapter) {
    adapter = createMeshAdapter({ mesh: getMeshStore(), ...adapterOptions })
  }
  try {
    await adapter.start()
  } catch (e) {
    onLog("BLE start failed: " + e.message)
  }
  return adapter
}

export async function stopMesh() {
  if (adapter) {
    try {
      await adapter.stop()
    } catch {}
  }
  adapter = null
  adapterOptions = null
}

/** Queue a hazard/distress message into the mesh outbox (works offline). */
export function queueMeshAlert({ type = "relay", severity = "INFO", zone = "", message = "", lat = null, lng = null, extra = null }) {
  return getMeshStore().addMessage({ type, severity, zone, message, lat, lng, extra })
}