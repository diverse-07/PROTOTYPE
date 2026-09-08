# AEGIS Mobile Application (NER-LEWS)

Native-style React + Capacitor mobile application designed for citizens, field volunteers, and rescue officers in Northeast India.

## Features:
- Physical sliding toggle: `[ ONLINE CLOUD (Live 4G) ]` vs `[ OFFLINE SURVIVAL (0 KB Data) ]`
- **Real Delay-Tolerant Bluetooth Low Energy (BLE) P2P Gossip Mesh** — phones advertise, discover each other, and relay alerts phone-to-phone through network blackouts (dedup, TTL/hop counting, auto-relay). No fake UI: driven by `@capgo/capacitor-bluetooth-low-energy` on Android.
- 1-Click Citizen GPS Safety Analyzer
- Pre-downloaded landslide AI risk matrices (GSI NLSM v3.2)
- Zero-database local onboarding saved in `localStorage` (mesh outbox/inbox also survives app restarts — the "delay-tolerant" part)
- 12 North Eastern scheduled languages
- Sub-5.9 MB standalone APK footprint

## How the BLE mesh works
Every phone runs **both** BLE roles at once:
1. **Peripheral** — advertises the AEGIS service UUID (`4e45522d-...` = "NER-LEWS-P2P-MES") with an `RX` write + `TX` notify characteristic.
2. **Central** — scans only for that service UUID, connects to each peer, negotiates MTU 512, writes its outbox to the peer's `RX`, and receives the peer's outbox via `TX` notifications.

Received messages are deduped (mesh-wide seen-set), stored in the inbox, and **auto-copied to the outbox with `TTL-1, hops+1`** so the next phone we meet carries them one hop further. Messages die out after 8 hops — no infinite loops.

> The capgo plugin is single-mode per native instance, so the adapter re-initializes it: build the GATT server + start advertising in `peripheral` mode, then re-init in `central` mode for scanning. The Android source keeps both the scanner and GATT server alive across `initialize()` calls, so both roles run simultaneously.

In a browser (`npm run dev`) there is no BLE radio, so the app uses a **simulator** that runs the *same* mesh core against a virtual neighbor node — the relay/dedup logic you see in the browser is the real thing.

## Quick Start (browser dev):
```bash
npm install
npm run dev
```
Open the Offline Survival mode → **Bluetooth P2P Mesh** tab. Scanning shows the simulator peers; Sync exchanges messages with the virtual neighbor and visibly relays them onward.

## Headless test of the mesh core (no phone needed):
```bash
node mesh-core.test.mjs
```
Covers direct exchange, mesh-wide dedup (loop prevention), TTL expiry, multi-frame chunking across the BLE write limit, and delay-tolerant persistence across simulated restarts.

## Build Android APK:
Requires Android Studio (with the Android SDK + JDK 17) on the build machine — this repo already contains the generated `android/` project and Capacitor 8.

```bash
npm run build            # build the web bundle
npx cap sync android     # copy web assets + plugin into android/
cd android
./gradlew assembleDebug  # (Windows: gradlew.bat assembleDebug)
```
The debug APK lands in `android/app/build/outputs/apk/debug/app-debug.apk`. Open `android/` in Android Studio and press ▶ for a one-click run on a connected phone.

> BLE permissions (`BLUETOOTH_SCAN/ADVERTISE/CONNECT` on Android 12+, `BLUETOOTH/BLUETOOTH_ADMIN` + location on Android 11 and below) are declared by the plugin and merged into the app manifest at build time. The app requests them at runtime on first use.

## Two-phone test procedure (real BLE relay):
1. Build the APK (above) and install it on **two Android phones** (Android 8.0+).
2. On both: enable **Bluetooth** and **Location** (Location is only needed for scanning on older Android).
3. Open the app on both phones → tap **OFFLINE SURVIVAL** → **Bluetooth P2P Mesh** tab on both (advertising only runs while the app is foregrounded — an OS restriction).
4. On phone A: tap **Scan for Nearby Bluetooth Peers** → A finds B (and vice versa).
5. On phone A: queue an SOS in the **Offline SOS Beacon Outbox** → tap **Sync** on B's peer card.
6. Phone B shows the message in its **Mesh Inbox** with `1 hop` and A's outbox clears ("Delivered"). B's copy now has `TTL 7, hops 1` in B's outbox — meet a third phone and B relays it automatically.
7. Verify the loop-prevention: sync again and the same message is rejected (deduped).

## Troubleshooting
- **"GATT server is only available in peripheral mode"** — the adapter re-inits the plugin mode automatically; make sure you're running the latest `android/` sync (`npx cap sync android`).
- **Peer doesn't appear in scan** — both phones must have the mesh tab open (foreground), and Location must be on for Android ≤ 11.
- **Sync fails mid-exchange** — range is 10–40 m in practice; move the phones closer and retry (there's a 20 s cooldown per peer to prevent sync loops).