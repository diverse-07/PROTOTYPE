// ============================================================
// AEGIS Delay-Tolerant BLE P2P Gossip Mesh — pure logic core
// No browser/Capacitor imports: unit-testable in Node.
// ============================================================

// GATT identifiers ("NER-LEWS-P2P-MES" / RX / TX as 128-bit UUIDs)
export const AEGIS_SERVICE_UUID = "4e45522d-4c45-5753-2d50-32502d4d4553" // NER-LEWS-P2P-MES
export const RX_CHAR_UUID = "4e45522d-4c45-5753-2d52-582d2d2d2d2d" // NER-LEWS-RX----- (central -> peripheral)
export const TX_CHAR_UUID = "4e45522d-4c45-5753-2d54-582d2d2d2d2d" // NER-LEWS-TX----- (peripheral -> central)

export const MAX_TTL = 8            // gossip hops before a relay copy expires
export const MAX_TEXT = 220         // chars per composed message
export const FRAME_BYTES = 400      // BLE write payload per frame (MTU-negotiated 512)
export const MAX_OUTBOX = 50
export const MAX_INBOX = 100
export const MAX_SEEN = 1000

const encoder = new TextEncoder()
const decoder = new TextDecoder()

export function randomId() {
  return "msg_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8)
}

// ------------------------------------------------------------------
// Chunking: batches are JSON-stringified and split into frames so a
// payload never exceeds one BLE write (ATT MTU).
// ------------------------------------------------------------------
export function buildFrames(payloadString, fragId = randomId()) {
  const bytes = encoder.encode(payloadString)
  const frames = []
  for (let i = 0; i < bytes.length; i += FRAME_BYTES) {
    const slice = bytes.slice(i, Math.min(i + FRAME_BYTES, bytes.length))
    frames.push({
      f: fragId,
      p: frames.length,
      n: Math.ceil(bytes.length / FRAME_BYTES),
      d: decoder.decode(slice),
    })
  }
  if (frames.length === 0) {
    frames.push({ f: fragId, p: 0, n: 1, d: "" })
  }
  return frames
}

export function makeFrameAssembler() {
  const buffer = new Map() // fragId -> { parts: [], n, receivedAt }
  return {
    /** Returns the assembled payload string when the frame set is complete, else null. */
    push(frame) {
      let entry = buffer.get(frame.f)
      if (!entry || entry.n !== frame.n) {
        // Dense array + explicit count: `every()` on a sparse array skips holes!
        entry = { parts: new Array(frame.n).fill(undefined), n: frame.n, count: 0, receivedAt: Date.now() }
        buffer.set(frame.f, entry)
      }
      if (entry.parts[frame.p] === undefined) entry.count++
      entry.parts[frame.p] = frame.d
      if (entry.count === entry.n) {
        buffer.delete(frame.f)
        return entry.parts.join("")
      }
      // garbage-collect stale partial sets (> 60 s old)
      if (buffer.size > 20) {
        const now = Date.now()
        for (const [k, v] of buffer) {
          if (now - v.receivedAt > 60000) buffer.delete(k)
        }
      }
      return null
    },
  }
}

// ------------------------------------------------------------------
// Mesh store: outbox / inbox / seen-set with localStorage persistence
// ------------------------------------------------------------------
export function createMeshStore(nodeId, storageAdapter) {
  const storage =
    storageAdapter ||
    (typeof localStorage !== "undefined" ? localStorage : null)

  const memory = {}

  const read = (key, fallback) => {
    try {
      const raw = storage ? storage.getItem(key) : memory[key]
      return raw ? JSON.parse(raw) : fallback
    } catch {
      return fallback
    }
  }
  const write = (key, value) => {
    try {
      const raw = JSON.stringify(value)
      if (storage) storage.setItem(key, raw)
      else memory[key] = raw
    } catch {
      /* quota exceeded — degrade gracefully */
    }
  }

  let seen = new Set(read("aegis_mesh_seen", []))
  let outbox = read("aegis_mesh_outbox", [])
  let inbox = read("aegis_mesh_inbox", [])
  let stats = read("aegis_mesh_stats", { sent: 0, received: 0, relayed: 0, deduped: 0, syncs: 0 })

  const persist = () => {
    write("aegis_mesh_seen", [...seen])
    write("aegis_mesh_outbox", outbox)
    write("aegis_mesh_inbox", inbox)
    write("aegis_mesh_stats", stats)
  }

  const trimSeen = () => {
    if (seen.size > MAX_SEEN) {
      seen = new Set([...seen].slice(seen.size - MAX_SEEN))
    }
  }

  return {
    nodeId,

    /** Compose + queue a new message on this device (goes to outbox). */
    addMessage({ type = "relay", severity = "INFO", zone = "", message = "", lat = null, lng = null, extra = null }) {
      const msg = {
        id: randomId(),
        type,
        severity,
        zone: String(zone || "").slice(0, 60),
        message: String(message || "").slice(0, MAX_TEXT),
        lat: lat != null ? Number(lat) : null,
        lng: lng != null ? Number(lng) : null,
        ts: Date.now(),
        from: nodeId,
        hops: 0,
        ttl: MAX_TTL,
        extra: extra || null,
      }
      if (!seen.has(msg.id)) seen.add(msg.id)
      outbox = [msg, ...outbox].slice(0, MAX_OUTBOX)
      persist()
      return msg
    },

    /**
     * Ingest messages received from a peer. Accepts unseen messages into the
     * inbox and — while TTL remains — copies them to the outbox so the next
     * peer we meet carries them one hop further (gossip relay).
     */
    receiveRemote(messages = []) {
      let accepted = 0
      let rejected = 0
      for (const raw of messages) {
        if (!raw || typeof raw.id !== "string") { rejected++; continue }
        if (seen.has(raw.id)) { rejected++; stats.deduped++; continue }
        seen.add(raw.id)
        const msg = {
          id: raw.id,
          type: ["alert", "sos", "relay", "info"].includes(raw.type) ? raw.type : "relay",
          severity: ["CRITICAL", "HIGH", "MODERATE", "INFO"].includes(raw.severity) ? raw.severity : "INFO",
          zone: String(raw.zone || "").slice(0, 60),
          message: String(raw.message || "").slice(0, MAX_TEXT),
          lat: raw.lat != null ? Number(raw.lat) : null,
          lng: raw.lng != null ? Number(raw.lng) : null,
          ts: Number(raw.ts) || Date.now(),
          from: String(raw.from || "unknown"),
          hops: Number(raw.hops) || 0,
          ttl: Number(raw.ttl) || 0,
          extra: raw.extra || null,
        }
        inbox = [msg, ...inbox].slice(0, MAX_INBOX)
        accepted++
        stats.received++
        // Relay forward (gossip): copy to outbox with decremented TTL.
        // KEEP the original id so dedup works mesh-wide (a message arriving
        // via two paths is only ever accepted once).
        if (msg.ttl > 0) {
          outbox = [
            { ...msg, ttl: msg.ttl - 1, hops: msg.hops + 1 },
            ...outbox,
          ].slice(0, MAX_OUTBOX)
          stats.relayed++
        }
      }
      trimSeen()
      persist()
      return { accepted, rejected }
    },

    /** Messages to beam out on the next peer connection. */
    pendingToSend(limit = 12) {
      return outbox.slice(0, limit)
    },

    /** Mark queued messages as delivered to a peer. */
    markDelivered(ids = []) {
      const idSet = new Set(ids)
      const before = outbox.length
      outbox = outbox.filter((m) => !idSet.has(m.id))
      const delivered = before - outbox.length
      if (delivered > 0) {
        stats.sent += delivered
        persist()
      }
      return delivered
    },

    allInbox() {
      return inbox
    },

    stats() {
      return {
        ...stats,
        outbox: outbox.length,
        inbox: inbox.length,
        seen: seen.size,
      }
    },
  }
}