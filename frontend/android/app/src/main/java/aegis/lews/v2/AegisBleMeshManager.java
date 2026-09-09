package aegis.lews.v2;

import android.Manifest;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothGatt;
import android.bluetooth.BluetoothGattCharacteristic;
import android.bluetooth.BluetoothGattServer;
import android.bluetooth.BluetoothGattServerCallback;
import android.bluetooth.BluetoothGattService;
import android.bluetooth.BluetoothManager;
import android.bluetooth.le.AdvertiseCallback;
import android.bluetooth.le.AdvertiseData;
import android.bluetooth.le.AdvertiseSettings;
import android.bluetooth.le.BluetoothLeAdvertiser;
import android.bluetooth.le.BluetoothLeScanner;
import android.bluetooth.le.ScanCallback;
import android.bluetooth.le.ScanFilter;
import android.bluetooth.le.ScanRecord;
import android.bluetooth.le.ScanResult;
import android.bluetooth.le.ScanSettings;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.ParcelUuid;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import androidx.core.app.ActivityCompat;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.json.JSONArray;
import org.json.JSONObject;

public class AegisBleMeshManager {
    private static final String TAG = "AegisBleMesh";
    public static final int REQ_CODE_BLE_PERMS = 1002;

    // Dedicated 128-bit AEGIS Sovereign Service UUID (0xAE61)
    public static final UUID AEGIS_SERVICE_UUID = UUID.fromString("0000AE61-0000-1000-8000-00805F9B34FB");
    public static final ParcelUuid AEGIS_PARCEL_UUID = new ParcelUuid(AEGIS_SERVICE_UUID);

    // Full SOS text characteristic UUID (0xAE62)
    public static final UUID AEGIS_CHAR_FULL_MSG_UUID = UUID.fromString("0000AE62-0000-1000-8000-00805F9B34FB");

    private static final byte MAGIC_BYTE = (byte) 0xAE;
    public static final byte TYPE_SOS = (byte) 0x01;
    public static final byte TYPE_WARNING = (byte) 0x02;
    public static final byte TYPE_BEACON = (byte) 0x03;
    public static final byte TYPE_WEB_RELAY = (byte) 0x04;

    private final MainActivity activity;
    private final WebView webView;
    private final BluetoothAdapter bluetoothAdapter;

    private BluetoothLeAdvertiser advertiser;
    private BluetoothLeScanner scanner;
    private BluetoothGattServer gattServer;

    private boolean isAdvertising = false;
    private boolean isScanning = false;
    private String currentSosText = "";
    private volatile short currentBroadcastNodeHash = 0;

    private final Map<String, JSONObject> discoveredPeers = new ConcurrentHashMap<>();
    private final Map<String, Long> lastAlertTriggerTimes = new ConcurrentHashMap<>();

    public AegisBleMeshManager(MainActivity activity, WebView webView) {
        this.activity = activity;
        this.webView = webView;

        BluetoothManager bm = (BluetoothManager) activity.getSystemService(Context.BLUETOOTH_SERVICE);
        if (bm != null) {
            this.bluetoothAdapter = bm.getAdapter();
        } else {
            this.bluetoothAdapter = null;
        }
    }

    public boolean hasPermissions() {
        return getMissingPermissionsList().isEmpty() && isBluetoothEnabled();
    }

    private boolean hasPermission(String permission) {
        return ActivityCompat.checkSelfPermission(activity, permission) == PackageManager.PERMISSION_GRANTED;
    }

    public List<String> getMissingPermissionsList() {
        List<String> missing = new ArrayList<>();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            if (!hasPermission(Manifest.permission.BLUETOOTH_ADVERTISE)) missing.add(Manifest.permission.BLUETOOTH_ADVERTISE);
            if (!hasPermission(Manifest.permission.BLUETOOTH_SCAN)) missing.add(Manifest.permission.BLUETOOTH_SCAN);
            if (!hasPermission(Manifest.permission.BLUETOOTH_CONNECT)) missing.add(Manifest.permission.BLUETOOTH_CONNECT);
            if (!hasPermission(Manifest.permission.ACCESS_FINE_LOCATION)) missing.add(Manifest.permission.ACCESS_FINE_LOCATION);
        } else {
            if (!hasPermission(Manifest.permission.ACCESS_FINE_LOCATION)) missing.add(Manifest.permission.ACCESS_FINE_LOCATION);
            if (!hasPermission(Manifest.permission.ACCESS_COARSE_LOCATION)) missing.add(Manifest.permission.ACCESS_COARSE_LOCATION);
            if (!hasPermission(Manifest.permission.BLUETOOTH)) missing.add(Manifest.permission.BLUETOOTH);
            if (!hasPermission(Manifest.permission.BLUETOOTH_ADMIN)) missing.add(Manifest.permission.BLUETOOTH_ADMIN);
        }
        return missing;
    }

    private boolean checkBlePermissions(boolean needAdvertise) {
        if (bluetoothAdapter == null || !bluetoothAdapter.isEnabled()) {
            return false;
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            if (!hasPermission(Manifest.permission.BLUETOOTH_SCAN) || !hasPermission(Manifest.permission.BLUETOOTH_CONNECT)) {
                return false;
            }
            if (needAdvertise && !hasPermission(Manifest.permission.BLUETOOTH_ADVERTISE)) {
                return false;
            }
        } else {
            if (!hasPermission(Manifest.permission.ACCESS_FINE_LOCATION)) {
                return false;
            }
        }
        return true;
    }

    public static String getPresetText(int code) {
        switch (code) {
            case 1: return "EVACUATE IMMEDIATELY: Debris flow expected in 15 mins. Move to safe ground.";
            case 2: return "DEBRIS FLOW IMMINENT: Heavy rainfall detected. Stay clear of natural drainage channels.";
            case 3: return "ROAD BLOCKED: Rockfall at highway corridor. Traffic suspended.";
            case 4: return "SHELTER IN PLACE: Seek designated bedrock refuge center.";
            case 5: return "FLASH FLOOD WARNING: Rapid runoff rising in valley floor.";
            case 6: return "BRIDGE WASHED OUT: Do not attempt crossing.";
            default: return "EMERGENCY DIRECTIVE: Follow local disaster authorities.";
        }
    }

    // =========================================================================
    // JAVASCRIPT INTERFACE METHODS (Called directly from React / AppMobile.jsx)
    // =========================================================================

    @JavascriptInterface
    public boolean isBluetoothSupported() {
        return bluetoothAdapter != null && activity.getPackageManager().hasSystemFeature(PackageManager.FEATURE_BLUETOOTH_LE);
    }

    @JavascriptInterface
    public boolean isBluetoothEnabled() {
        return bluetoothAdapter != null && bluetoothAdapter.isEnabled();
    }

    @JavascriptInterface
    public void requestEnableBluetooth() {
        if (bluetoothAdapter != null && !bluetoothAdapter.isEnabled()) {
            activity.runOnUiThread(() -> {
                try {
                    Intent enableBtIntent = new Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE);
                    enableBtIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    activity.startActivity(enableBtIntent);
                } catch (Exception e) {
                    Log.e(TAG, "Failed to request bluetooth enable", e);
                }
            });
        }
    }

    @JavascriptInterface
    public String checkAndRequestBlePermissions() {
        JSONObject res = new JSONObject();
        try {
            List<String> missing = getMissingPermissionsList();
            boolean btEnabled = isBluetoothEnabled();
            boolean allGranted = missing.isEmpty();

            res.put("allGranted", allGranted);
            res.put("bluetoothEnabled", btEnabled);

            JSONArray missingArr = new JSONArray();
            for (String p : missing) missingArr.put(p);
            res.put("missing", missingArr);

            if (!allGranted) {
                activity.runOnUiThread(() -> {
                    ActivityCompat.requestPermissions(activity, missing.toArray(new String[0]), REQ_CODE_BLE_PERMS);
                });
                res.put("promptTriggered", true);
            } else {
                res.put("promptTriggered", false);
            }

            if (!btEnabled) {
                requestEnableBluetooth();
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in checkAndRequestBlePermissions", e);
        }
        return res.toString();
    }

    @JavascriptInterface
    public boolean isScanningActive() {
        return isScanning;
    }

    @JavascriptInterface
    public boolean isAdvertisingActive() {
        return isAdvertising;
    }

    @JavascriptInterface
    public String startMeshScan() {
        if (!checkBlePermissions(false)) {
            checkAndRequestBlePermissions();
            return "{\"status\":\"error\",\"message\":\"Missing Bluetooth Scan / Location Permissions. Prompting user.\"}";
        }
        try {
            if (scanner == null) {
                scanner = bluetoothAdapter.getBluetoothLeScanner();
            }
            if (scanner == null) {
                return "{\"status\":\"error\",\"message\":\"Bluetooth LE Scanner unavailable\"}";
            }

            List<ScanFilter> filters = new ArrayList<>();
            filters.add(new ScanFilter.Builder().setServiceUuid(AEGIS_PARCEL_UUID).build());
            try {
                filters.add(new ScanFilter.Builder().setServiceData(AEGIS_PARCEL_UUID, new byte[]{(byte) 0xAE}, new byte[]{(byte) 0xFF}).build());
            } catch (Exception ignored) {}

            ScanSettings settings = new ScanSettings.Builder()
                .setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY)
                .setReportDelay(0)
                .build();

            scanner.startScan(filters, settings, scanCallback);
            isScanning = true;
            Log.d(TAG, "BLE Mesh Scan started");
            return "{\"status\":\"success\",\"message\":\"Hardware BLE Mesh scan active\"}";
        } catch (SecurityException se) {
            return "{\"status\":\"error\",\"message\":\"SecurityException: " + se.getMessage() + "\"}";
        } catch (Exception e) {
            return "{\"status\":\"error\",\"message\":\"" + e.getMessage() + "\"}";
        }
    }

    @JavascriptInterface
    public String stopMeshScan() {
        if (scanner != null && isScanning) {
            try {
                if (checkBlePermissions(false)) {
                    scanner.stopScan(scanCallback);
                }
            } catch (Exception ignored) {}
            isScanning = false;
        }
        return "{\"status\":\"success\",\"message\":\"Scan stopped\"}";
    }

    @JavascriptInterface
    public String broadcastSos(String nodeId, String zoneName, int riskScore, double lat, double lng, String message) {
        return startHardwareBroadcast(TYPE_SOS, nodeId, zoneName, riskScore, 1, 4, lat, lng, message);
    }

    @JavascriptInterface
    public String broadcastWarning(String zoneName, int riskScore, String message) {
        return startHardwareBroadcast(TYPE_WARNING, "CMD-RELAY", zoneName, riskScore, 2, 3, 25.4484, 92.2152, message);
    }

    @JavascriptInterface
    public String broadcastPeerBeacon(String nodeId, String citizenName) {
        return startHardwareBroadcast(TYPE_BEACON, nodeId, citizenName, 0, 0, 1, 0, 0, citizenName);
    }

    @JavascriptInterface
    public String broadcastWebRelay(String zoneName, int riskScore, int presetCode, int severityCode, double lat, double lng, String message) {
        List<String> missing = getMissingPermissionsList();
        if (!missing.isEmpty()) {
            checkAndRequestBlePermissions();
            return "{\"status\":\"awaiting_permissions\",\"message\":\"System permissions missing. Prompting user.\"}";
        }
        if (!isBluetoothEnabled()) {
            requestEnableBluetooth();
            return "{\"status\":\"bluetooth_disabled\",\"message\":\"Bluetooth radio is off. Prompted user to enable.\"}";
        }
        return startHardwareBroadcast(TYPE_WEB_RELAY, "GATEWAY-RELAY", zoneName, riskScore, presetCode, severityCode, lat, lng, message);
    }

    @JavascriptInterface
    public String stopBroadcast() {
        stopHardwareBroadcast();
        return "{\"status\":\"success\",\"message\":\"BLE Broadcast stopped\"}";
    }

    @JavascriptInterface
    public void silenceNativeSiren() {
        try {
            AegisSirenService.stopSirenDirectly(activity);
        } catch (Exception e) {
            Log.e(TAG, "Failed to silence native siren", e);
        }
    }

    @JavascriptInterface
    public void stopMeshRelay() {
        try {
            stopHardwareBroadcast();
        } catch (Exception e) {
            Log.e(TAG, "Failed to stop mesh relay", e);
        }
    }

    @JavascriptInterface
    public void triggerNativeSiren(String message) {
        try {
            AegisSirenService.startSirenDirectly(activity, message);
        } catch (Exception e) {
            Log.e(TAG, "Failed to trigger native siren", e);
        }
    }

    @JavascriptInterface
    public String getDiscoveredPeers() {
        JSONArray arr = new JSONArray();
        for (JSONObject peer : discoveredPeers.values()) {
            arr.put(peer);
        }
        return arr.toString();
    }

    public void onPermissionsUpdated(boolean allGranted) {
        activity.runOnUiThread(() -> {
            String js = "if (window.onAegisBlePermissionsResult) { window.onAegisBlePermissionsResult(" + allGranted + "); }";
            webView.evaluateJavascript(js, null);
        });
    }

    // =========================================================================
    // NATIVE BLE BROADCAST & GATT SERVER
    // =========================================================================

    private synchronized String startHardwareBroadcast(byte type, String nodeId, String zoneName, int riskScore, int presetCode, int severityCode, double lat, double lng, String message) {
        if (!checkBlePermissions(true)) {
            checkAndRequestBlePermissions();
            return "{\"status\":\"error\",\"message\":\"Missing Bluetooth Advertising permissions\"}";
        }

        stopHardwareBroadcast();

        if (advertiser == null) {
            advertiser = bluetoothAdapter.getBluetoothLeAdvertiser();
        }
        if (advertiser == null) {
            return "{\"status\":\"error\",\"message\":\"Hardware BLE Advertiser not supported on this device\"}";
        }

        this.currentSosText = message != null ? message : "";
        if (nodeId != null) {
            this.currentBroadcastNodeHash = (short) Math.abs(nodeId.hashCode() & 0x7FFF);
        }
        setupGattServer(this.currentSosText);

        byte[] payload = encodePacket(type, nodeId, riskScore, presetCode, severityCode, lat, lng, message != null ? message : zoneName);

        AdvertiseSettings settings = new AdvertiseSettings.Builder()
            .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY)
            .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_HIGH)
            .setConnectable(true)
            .setTimeout(0)
            .build();

        AdvertiseData data = new AdvertiseData.Builder()
            .addServiceData(AEGIS_PARCEL_UUID, payload)
            .setIncludeTxPowerLevel(false)
            .build();

        AdvertiseData scanResponse = new AdvertiseData.Builder()
            .addServiceUuid(AEGIS_PARCEL_UUID)
            .setIncludeDeviceName(true)
            .build();

        try {
            advertiser.startAdvertising(settings, data, scanResponse, advertiseCallback);
            isAdvertising = true;
            Log.d(TAG, "BLE Broadcast initiated for type: " + type + ", node: " + nodeId);
            return "{\"status\":\"success\",\"type\":" + (int) type + ",\"message\":\"Broadcasting over BLE hardware radio\"}";
        } catch (SecurityException se) {
            return "{\"status\":\"error\",\"message\":\"SecurityException: " + se.getMessage() + "\"}";
        } catch (Exception e) {
            return "{\"status\":\"error\",\"message\":\"" + e.getMessage() + "\"}";
        }
    }

    private synchronized void stopHardwareBroadcast() {
        if (advertiser != null && isAdvertising) {
            try {
                if (checkBlePermissions(true)) {
                    advertiser.stopAdvertising(advertiseCallback);
                }
            } catch (Exception ignored) {}
            isAdvertising = false;
            this.currentBroadcastNodeHash = 0;
            Log.d(TAG, "BLE Hardware Broadcast stopped");
        }
        if (gattServer != null) {
            try {
                if (checkBlePermissions(true)) {
                    gattServer.close();
                }
            } catch (Exception ignored) {}
            gattServer = null;
        }
    }

    private void setupGattServer(final String textPayload) {
        if (gattServer != null) {
            try {
                if (checkBlePermissions(true)) {
                    gattServer.close();
                }
            } catch (Exception ignored) {}
            gattServer = null;
        }
        try {
            BluetoothManager bm = (BluetoothManager) activity.getSystemService(Context.BLUETOOTH_SERVICE);
            if (bm == null || !checkBlePermissions(true)) return;

            gattServer = bm.openGattServer(activity, new BluetoothGattServerCallback() {
                @Override
                public void onCharacteristicReadRequest(BluetoothDevice device, int requestId, int offset, BluetoothGattCharacteristic characteristic) {
                    super.onCharacteristicReadRequest(device, requestId, offset, characteristic);
                    if (AEGIS_CHAR_FULL_MSG_UUID.equals(characteristic.getUuid())) {
                        byte[] data = textPayload.getBytes(StandardCharsets.UTF_8);
                        byte[] response = new byte[Math.max(0, data.length - offset)];
                        if (data.length > offset) {
                            System.arraycopy(data, offset, response, 0, response.length);
                        }
                        try {
                            if (checkBlePermissions(true)) {
                                gattServer.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, offset, response);
                            }
                        } catch (SecurityException ignored) {}
                    }
                }
            });

            BluetoothGattService service = new BluetoothGattService(AEGIS_SERVICE_UUID, BluetoothGattService.SERVICE_TYPE_PRIMARY);
            BluetoothGattCharacteristic charMsg = new BluetoothGattCharacteristic(
                AEGIS_CHAR_FULL_MSG_UUID,
                BluetoothGattCharacteristic.PROPERTY_READ,
                BluetoothGattCharacteristic.PERMISSION_READ
            );
            service.addCharacteristic(charMsg);
            gattServer.addService(service);
        } catch (Exception e) {
            Log.w(TAG, "GattServer setup failed: " + e.getMessage());
        }
    }

    // =========================================================================
    // PACKET ENCODING / DECODING
    // =========================================================================

    /**
     * Compact binary format (Max 20 bytes for ServiceData to guarantee <= 31 bytes PDU):
     * [0]     : Magic Byte (0xAE)
     * [1]     : Packet Type (1=SOS, 2=Warning, 3=Beacon, 4=WebRelay)
     * [2]     : Risk Score (0-100)
     * [3-4]   : Node ID Numeric Hash (2 bytes)
     * [5-8]   : Lat Int32 (lat * 100000)
     * [9-12]  : Lng Int32 (lng * 100000)
     * [13]    : Packed Meta ((severityCode << 4) | (presetCode & 0x0F))
     * [14..19]: Text / Message snippet (up to 6 bytes UTF-8)
     */
    private byte[] encodePacket(byte type, String nodeId, int riskScore, int presetCode, int severityCode, double lat, double lng, String text) {
        ByteBuffer buf = ByteBuffer.allocate(20);
        buf.put(MAGIC_BYTE);
        buf.put(type);
        buf.put((byte) Math.max(0, Math.min(100, riskScore)));

        short nodeHash = 0;
        if (nodeId != null) {
            nodeHash = (short) Math.abs(nodeId.hashCode() & 0x7FFF);
        }
        buf.putShort(nodeHash);

        int latInt = (int) (lat * 100000);
        int lngInt = (int) (lng * 100000);
        buf.putInt(latInt);
        buf.putInt(lngInt);

        byte packedMeta = (byte) (((severityCode & 0x0F) << 4) | (presetCode & 0x0F));
        buf.put(packedMeta);

        if (text != null && !text.isEmpty()) {
            byte[] textBytes = text.getBytes(StandardCharsets.UTF_8);
            int len = Math.min(textBytes.length, buf.remaining());
            buf.put(textBytes, 0, len);
        }

        return buf.array();
    }

    private JSONObject decodePacket(byte[] data, int rssi, int txPower) {
        if (data == null || data.length < 14 || data[0] != MAGIC_BYTE) {
            return null;
        }
        try {
            ByteBuffer buf = ByteBuffer.wrap(data);
            buf.get(); // skip magic
            byte type = buf.get();
            int riskScore = buf.get() & 0xFF;
            short nodeHash = buf.getShort();

            // Self-packet echo prevention: ignore packets transmitted by this device
            if (isAdvertising && currentBroadcastNodeHash != 0 && nodeHash == currentBroadcastNodeHash) {
                return null;
            }

            int latInt = buf.getInt();
            int lngInt = buf.getInt();
            byte packedMeta = buf.get();

            int severityCode = (packedMeta >> 4) & 0x0F;
            int presetCode = packedMeta & 0x0F;
            String presetText = getPresetText(presetCode);

            double lat = latInt / 100000.0;
            double lng = lngInt / 100000.0;

            String snippet = "";
            int remaining = buf.remaining();
            if (remaining > 0) {
                byte[] textBytes = new byte[remaining];
                buf.get(textBytes);
                snippet = new String(textBytes, StandardCharsets.UTF_8).trim();
            }

            // Estimate distance from RSSI and TxPower
            int effectiveTx = (txPower != Integer.MIN_VALUE && txPower != 0) ? txPower : -59;
            double distMeters = Math.pow(10.0, (effectiveTx - rssi) / (20.0));
            distMeters = Math.max(0.5, Math.min(99.0, distMeters));

            JSONObject obj = new JSONObject();
            String typeStr = "BEACON";
            if (type == TYPE_SOS) typeStr = "SOS";
            else if (type == TYPE_WARNING) typeStr = "WARNING";
            else if (type == TYPE_WEB_RELAY) typeStr = "WEB_RELAY";

            obj.put("type", typeStr);
            obj.put("typeCode", (int) type);
            obj.put("nodeId", "GATEWAY-" + String.format(Locale.US, "%04d", Math.abs(nodeHash)));
            obj.put("riskScore", riskScore);
            obj.put("presetCode", presetCode);
            obj.put("presetText", presetText);
            obj.put("severityCode", severityCode);
            obj.put("severity", severityCode >= 4 ? "CRITICAL" : (severityCode == 3 ? "HIGH" : "MODERATE"));
            obj.put("lat", lat);
            obj.put("lng", lng);
            obj.put("message", !snippet.isEmpty() ? snippet : presetText);
            obj.put("fullDirective", presetText);
            obj.put("rssi", rssi + " dBm");
            obj.put("distanceMeters", Double.parseDouble(String.format(Locale.US, "%.1f", distMeters)));
            obj.put("distStr", String.format(Locale.US, "%.1fm", distMeters));
            obj.put("timestamp", System.currentTimeMillis());
            return obj;
        } catch (Exception e) {
            return null;
        }
    }

    // =========================================================================
    // CALLBACKS
    // =========================================================================

    private final AdvertiseCallback advertiseCallback = new AdvertiseCallback() {
        @Override
        public void onStartSuccess(AdvertiseSettings settingsInEffect) {
            super.onStartSuccess(settingsInEffect);
            Log.i(TAG, "BLE Hardware Advertise Started Successfully");
        }

        @Override
        public void onStartFailure(int errorCode) {
            super.onStartFailure(errorCode);
            isAdvertising = false;
            Log.e(TAG, "BLE Hardware Advertise Failed with error: " + errorCode);
        }
    };

    private final ScanCallback scanCallback = new ScanCallback() {
        @Override
        public void onScanResult(int callbackType, ScanResult result) {
            super.onScanResult(callbackType, result);
            handleScanResult(result);
        }

        @Override
        public void onBatchScanResults(List<ScanResult> results) {
            super.onBatchScanResults(results);
            for (ScanResult r : results) {
                handleScanResult(r);
            }
        }

        @Override
        public void onScanFailed(int errorCode) {
            super.onScanFailed(errorCode);
            isScanning = false;
            Log.e(TAG, "BLE Hardware Scan Failed with error: " + errorCode);
        }
    };

    private void handleScanResult(ScanResult result) {
        if (result == null || result.getScanRecord() == null) return;

        ScanRecord record = result.getScanRecord();
        byte[] serviceData = record.getServiceData(AEGIS_PARCEL_UUID);
        if (serviceData == null) {
            Map<ParcelUuid, byte[]> map = record.getServiceData();
            if (map != null) {
                for (Map.Entry<ParcelUuid, byte[]> entry : map.entrySet()) {
                    if (entry.getKey() != null && entry.getKey().getUuid().toString().toLowerCase().contains("ae61")) {
                        serviceData = entry.getValue();
                        break;
                    }
                }
            }
        }
        if (serviceData == null) return;

        JSONObject parsed = decodePacket(serviceData, result.getRssi(), result.getTxPower());
        if (parsed == null) return;

        try {
            String deviceAddress = result.getDevice() != null ? result.getDevice().getAddress() : parsed.getString("nodeId");
            parsed.put("address", deviceAddress);

            discoveredPeers.put(deviceAddress, parsed);

            int typeCode = parsed.getInt("typeCode");
            boolean isEmergency = (typeCode == TYPE_SOS || typeCode == TYPE_WARNING || typeCode == TYPE_WEB_RELAY);

            // Deduplication: prevent repeated alarms within 3.5 seconds for the same event
            String alertKey = deviceAddress + "_" + typeCode + "_" + parsed.optInt("presetCode", 0);
            long now = System.currentTimeMillis();
            Long lastTrigger = lastAlertTriggerTimes.get(alertKey);
            boolean shouldTriggerAlarm = isEmergency && (lastTrigger == null || (now - lastTrigger) > 3500);

            // Do not re-trigger siren if we are already actively broadcasting this exact alert
            if (shouldTriggerAlarm && isAdvertising && currentSosText != null && !currentSosText.isEmpty()) {
                String msg = parsed.optString("message", "");
                String directive = parsed.optString("fullDirective", "");
                if (currentSosText.equalsIgnoreCase(msg) || currentSosText.equalsIgnoreCase(directive)) {
                    shouldTriggerAlarm = false;
                }
            }

            if (shouldTriggerAlarm) {
                lastAlertTriggerTimes.put(alertKey, now);
                // DIRECT HARDWARE NATIVE SIREN TRIGGER: Wakes screen, raises volume to max, wails siren audio & vibrates
                String alertMsg = parsed.optString("fullDirective", parsed.optString("message", "CRITICAL EVACUATION ALARM"));
                AegisSirenService.startSirenDirectly(activity, alertMsg);

                // AUTOMATIC MULTI-HOP MESH RELAY:
                // An offline device that catches the emergency packet immediately switches into
                // BLE Advertiser mode to propagate the alert to other nearby offline citizens!
                if (!isAdvertising) {
                    try {
                        byte incomingType = (byte) typeCode;
                        int riskScore = parsed.optInt("riskScore", 85);
                        int presetCode = parsed.optInt("presetCode", 1);
                        int severityCode = parsed.optInt("severityCode", 4);
                        double lat = parsed.optDouble("lat", 25.4484);
                        double lng = parsed.optDouble("lng", 92.2152);
                        String msg = parsed.optString("message", alertMsg);
                        startHardwareBroadcast(incomingType, "MESH-RELAY", "RELAY", riskScore, presetCode, severityCode, lat, lng, msg);
                        Log.i(TAG, "Multi-hop BLE mesh relay triggered automatically for incoming alert!");
                    } catch (Exception relayEx) {
                        Log.w(TAG, "Could not auto-start multi-hop BLE relay", relayEx);
                    }
                }
            }

            final String jsonStr = parsed.toString();

            activity.runOnUiThread(() -> {
                // Inform React frontend of discovered peer
                webView.evaluateJavascript("if (window.onAegisBlePeerDiscovered) { window.onAegisBlePeerDiscovered(" + jsonStr + "); }", null);

                // If emergency SOS, warning, or WebRelay packet, trigger immediate packet listener
                if (isEmergency) {
                    webView.evaluateJavascript("if (window.onAegisBlePacketReceived) { window.onAegisBlePacketReceived(" + jsonStr + "); }", null);
                    webView.evaluateJavascript("if (window.triggerNativeAegisAlert) { window.triggerNativeAegisAlert(" + jsonStr + "); }", null);
                }
            });
        } catch (Exception e) {
            Log.e(TAG, "Error handling BLE scan result", e);
        }
    }

    public void cleanup() {
        stopMeshScan();
        stopHardwareBroadcast();
    }
}
