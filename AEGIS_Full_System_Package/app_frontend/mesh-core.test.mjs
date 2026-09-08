// AEGIS mesh core — headless test (run: node mesh-core.test.mjs)
import {
  createMeshStore,
  buildFrames,
  makeFrameAssembler,
  MAX_TTL,
} from "./src/lib/bleMesh.js"

let pass = 0
let fail = 0
const assert = (cond, name) => {
  if (cond) { pass++; console.log("  ✔ " + name) }
  else { fail++; console.log("  ✘ FAIL: " + name) }
}

const memStorage = () => {
  const m = new Map()
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v) }
}

// Simulated BLE link between two stores, using the real frame protocol.
const link = (a, b) => {
  const aOut = a.pendingToSend(12)
  const delivered = aOut.map((m) => m.id)
  let accepted = 0
  if (aOut.length > 0) {
    const payload = JSON.stringify({ v: 1, node: a.nodeId, msgs: aOut })
    const asm = makeFrameAssembler()
    let joined = null
    for (const f of buildFrames(payload)) joined = asm.push(f)
    accepted = b.receiveRemote(JSON.parse(joined).msgs).accepted
    a.markDelivered(delivered)
  }
  return { sent: aOut.length, accepted }
}

console.log("1) Direct exchange + relay copy")
{
  const A = createMeshStore("A", memStorage())
  const B = createMeshStore("B", memStorage())
  const msg = A.addMessage({ type: "alert", severity: "CRITICAL", zone: "NH-44 Km 48", message: "Shale slip blocked the highway. 3 vehicles stranded." })
  const r = link(A, B)
  assert(r.sent === 1, "A sends 1 message to B")
  assert(r.accepted === 1, "B accepts it")
  assert(B.allInbox().length === 1 && B.allInbox()[0].id === msg.id, "B inbox holds the original message")
  assert(A.pendingToSend().length === 0, "A outbox cleared after delivery")
  const relay = B.pendingToSend().find((m) => m.id === msg.id)
  assert(!!relay && relay.ttl === MAX_TTL - 1 && relay.hops === 1, "B auto-relays with TTL-1, hops+1")
}

console.log("2) Mesh-wide dedup (loop prevention)")
{
  const A = createMeshStore("A", memStorage())
  const B = createMeshStore("B", memStorage())
  const C = createMeshStore("C", memStorage())
  A.addMessage({ type: "sos", severity: "CRITICAL", zone: "Km 42", message: "Bridge collapse. 4 people need rescue." })
  link(A, B) // B now has a relay copy
  const res = link(B, C) // C receives it via B
  assert(res.accepted === 1, "C accepts the relayed message")
  const again = link(B, C) // duplicate path — B still holds a relay copy
  assert(again.accepted === 0, "duplicate delivery deduped (no loop)")
  const direct = createMeshStore("D", memStorage())
  // D receives the same original id via a different path — must still dedup
  const orig = A.pendingToSend()
  // craft: re-send original from A's history? Use a fresh copy with same id.
  const dRes = direct.receiveRemote([{ id: "msg_x", type: "alert", severity: "HIGH", zone: "Z", message: "m", ts: Date.now(), from: "A", hops: 0, ttl: MAX_TTL }])
  assert(dRes.accepted === 1, "D accepts a fresh message id")
  const dRes2 = direct.receiveRemote([{ id: "msg_x", type: "alert", severity: "HIGH", zone: "Z", message: "m", ts: Date.now(), from: "A", hops: 0, ttl: MAX_TTL }])
  assert(dRes2.accepted === 0, "same id arriving again is rejected")
}

console.log("3) TTL expiry stops infinite gossip")
{
  const A = createMeshStore("A", memStorage())
  A.addMessage({ type: "alert", severity: "HIGH", zone: "Z", message: "Watch zone alert" })
  let cur = A
  const nodes = []
  for (let i = 0; i < MAX_TTL + 2; i++) nodes.push(createMeshStore("N" + i, memStorage()))
  let acceptedTotal = 0
  const acceptedPerNode = []
  for (const n of nodes) {
    const r = link(cur, n)
    acceptedTotal += r.accepted
    acceptedPerNode.push(r.accepted)
    cur = n
  }
  // Original (TTL 8) + 7 relays + 1 final delivery of a TTL-0 copy = 9 accepts.
  // The TTL-0 copy is accepted but NEVER relayed, so propagation stops there.
  assert(acceptedTotal === MAX_TTL + 1, "message delivers through TTL chain then dies (" + acceptedTotal + ")")
  const last = nodes[nodes.length - 1]
  assert(acceptedPerNode[acceptedPerNode.length - 1] === 0, "nothing propagates past the exhausted chain")
  assert(last.pendingToSend().length === 0, "no relay copy survives past TTL")
}

console.log("4) Multi-frame chunking across the BLE write limit")
{
  const A = createMeshStore("A", memStorage())
  const B = createMeshStore("B", memStorage())
  for (let i = 0; i < 40; i++) {
    A.addMessage({ type: "relay", severity: "INFO", zone: "Zone " + i, message: "Sample alert payload number " + i + " — longer than usual to force frame splitting across the 400-byte BLE write budget." })
  }
  const payload = JSON.stringify({ v: 1, node: A.nodeId, msgs: A.pendingToSend(40) })
  const frames = buildFrames(payload)
  assert(frames.length > 1, "batch split into " + frames.length + " frames")
  const asm = makeFrameAssembler()
  let joined = null
  for (const f of frames) joined = asm.push(f)
  const msgs = JSON.parse(joined).msgs
  assert(msgs.length === 40, "all 40 messages reassembled intact")
  assert(msgs[39].message.includes("force frame splitting"), "payload content survived byte-exact")
}

console.log("5) Delay-tolerant persistence across app restarts")
{
  const storage = memStorage()
  const A1 = createMeshStore("A", storage)
  const m = A1.addMessage({ type: "sos", severity: "CRITICAL", zone: "Km 50", message: "Stranded on shoulder. Family of 5. Need water." })
  // "reboot" — brand-new store over the same storage
  const A2 = createMeshStore("A", storage)
  assert(A2.pendingToSend().some((x) => x.id === m.id), "outbox survives restart (delay-tolerant)")
  // a second node B receives it after the restart
  const B = createMeshStore("B", memStorage())
  const r = link(A2, B)
  assert(r.accepted === 1, "persisted message delivered to a peer after restart")
}

console.log("\nResult: " + pass + " passed, " + fail + " failed")
process.exit(fail > 0 ? 1 : 0)