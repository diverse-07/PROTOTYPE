package aegis.lews.v2;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.media.AudioFormat;
import android.media.AudioManager;
import android.media.AudioTrack;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.os.VibrationEffect;
import android.os.Vibrator;
import androidx.core.app.NotificationCompat;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

public class AegisSirenService extends Service {
    private static final String CHANNEL_MONITOR = "aegis_monitor_channel";
    private static final String CHANNEL_SIREN = "aegis_emergency_siren";
    private static final int NOTIF_MONITOR_ID = 1001;
    private static final int NOTIF_SIREN_ID = 1002;
    private static final String NTFY_STREAM_URL = "https://ntfy.sh/ner_landslide_alert/raw";

    private static volatile boolean isRunning = false;
    private static volatile boolean isSirenActive = false;

    private Thread workerThread;
    private PowerManager.WakeLock cpuWakeLock;
    private AudioTrack sirenAudioTrack;
    private Vibrator vibrator;
    private AudioManager audioManager;

    public static void start(Context context) {
        try {
            Intent intent = new Intent(context, AegisSirenService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent);
            } else {
                context.startService(intent);
            }
        } catch (Exception ignored) {}
    }

    public static void startSirenDirectly(Context context, String message) {
        try {
            Intent intent = new Intent(context, AegisSirenService.class);
            intent.setAction("ACTION_START_SIREN");
            intent.putExtra("aegis_message", message != null ? message : "CRITICAL EVACUATION SIREN ACTIVE");
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent);
            } else {
                context.startService(intent);
            }
        } catch (Exception ignored) {}
    }

    public static void stopSirenDirectly(Context context) {
        try {
            Intent intent = new Intent(context, AegisSirenService.class);
            intent.setAction("ACTION_STOP_SIREN");
            context.startService(intent);
        } catch (Exception ignored) {}
    }

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannels();
        audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
        vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);

        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (pm != null) {
            cpuWakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "aegis:service_cpu_lock");
            cpuWakeLock.acquire();
        }

        Notification notification = buildForegroundNotification();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            startForeground(NOTIF_MONITOR_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC | ServiceInfo.FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE);
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIF_MONITOR_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC);
        } else {
            startForeground(NOTIF_MONITOR_ID, notification);
        }

        startStreamListener();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            if ("ACTION_STOP_SIREN".equals(intent.getAction())) {
                stopEmergencySiren();
            } else if ("ACTION_START_SIREN".equals(intent.getAction())) {
                String msg = intent.getStringExtra("aegis_message");
                if (msg == null || msg.isEmpty()) msg = "CRITICAL EVACUATION SIREN ACTIVE";
                triggerEmergencySiren(msg);
            }
        }
        return START_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm == null) return;

            // 1. Silent persistent channel for foreground monitor
            NotificationChannel monitorChannel = new NotificationChannel(
                CHANNEL_MONITOR,
                "AEGIS Cloud Monitor",
                NotificationManager.IMPORTANCE_LOW
            );
            monitorChannel.setDescription("Monitors MDoNER early warning disaster telemetry in background");
            monitorChannel.setShowBadge(false);
            nm.createNotificationChannel(monitorChannel);

            // 2. High priority wailing siren channel
            NotificationChannel sirenChannel = new NotificationChannel(
                CHANNEL_SIREN,
                "AEGIS Critical Evacuation Siren",
                NotificationManager.IMPORTANCE_HIGH
            );
            sirenChannel.setDescription("Life-safety evacuation alarms and forced phone sirens");
            sirenChannel.enableVibration(true);
            sirenChannel.setVibrationPattern(new long[]{0, 1000, 300, 1000, 300, 1500, 500});
            sirenChannel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            sirenChannel.setBypassDnd(true);
            nm.createNotificationChannel(sirenChannel);
        }
    }

    private Notification buildForegroundNotification() {
        Intent launchIntent = new Intent(this, MainActivity.class);
        PendingIntent pi = PendingIntent.getActivity(
            this, 0, launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        return new NotificationCompat.Builder(this, CHANNEL_MONITOR)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle("AEGIS Early Warning Active")
            .setContentText("Connected to MDoNER Cloud • Instant Siren Armed")
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .setContentIntent(pi)
            .build();
    }

    private void startStreamListener() {
        if (isRunning) return;
        isRunning = true;

        workerThread = new Thread(() -> {
            while (isRunning) {
                HttpURLConnection conn = null;
                BufferedReader reader = null;
                try {
                    URL url = new URL(NTFY_STREAM_URL);
                    conn = (HttpURLConnection) url.openConnection();
                    conn.setRequestMethod("GET");
                    conn.setConnectTimeout(15000);
                    conn.setReadTimeout(0); // Indefinite streaming
                    conn.setRequestProperty("User-Agent", "AEGIS-Android-Client/2.0");

                    int code = conn.getResponseCode();
                    if (code == 200) {
                        reader = new BufferedReader(new InputStreamReader(conn.getInputStream(), "UTF-8"));
                        String line;
                        while (isRunning && (line = reader.readLine()) != null) {
                            line = line.trim();
                            if (line.isEmpty()) continue;

                            if (line.contains("AEGIS_SILENCE_ALL_SIRENS") || line.contains("AEGIS_SILENCE_CMD")) {
                                stopEmergencySiren();
                            } else if (line.contains("CRITICAL") || line.contains("SIREN") || line.contains("EVACUATION") || line.contains("ALERT")) {
                                triggerEmergencySiren(line);
                            }
                        }
                    }
                } catch (Exception e) {
                    try { Thread.sleep(2000); } catch (InterruptedException ignored) {}
                } finally {
                    try { if (reader != null) reader.close(); } catch (Exception ignored) {}
                    try { if (conn != null) conn.disconnect(); } catch (Exception ignored) {}
                }
            }
        });
        workerThread.setName("AegisNtfyStreamWorker");
        workerThread.start();
    }

    private synchronized void triggerEmergencySiren(String message) {
        if (isSirenActive) return;
        isSirenActive = true;

        // 1. WAKE UP DEVICE SCREEN & CPU (Turn screen on even when locked)
        try {
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                PowerManager.WakeLock screenWakeLock = pm.newWakeLock(
                    PowerManager.FULL_WAKE_LOCK |
                    PowerManager.ACQUIRE_CAUSES_WAKEUP |
                    PowerManager.ON_AFTER_RELEASE,
                    "aegis:emergency_screen_wakeup"
                );
                screenWakeLock.acquire(60000);
            }
        } catch (Exception ignored) {}

        // 2. SET PHONE ALARM VOLUME TO MAX (Bypasses Silent/Vibrate mode)
        try {
            if (audioManager != null) {
                int maxVol = audioManager.getStreamMaxVolume(AudioManager.STREAM_ALARM);
                audioManager.setStreamVolume(AudioManager.STREAM_ALARM, maxVol, 0);
            }
        } catch (Exception ignored) {}

        // 3. START LOUD WAILING DISASTER SIREN AUDIO (NDMA 750Hz <-> 1250Hz AudioTrack on STREAM_ALARM)
        startNativeSirenTone();

        // 4. CONTINUOUS AGGRESSIVE VIBRATION
        try {
            if (vibrator != null && vibrator.hasVibrator()) {
                long[] pattern = {0, 1000, 300, 1000, 300, 1500, 500};
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator.vibrate(VibrationEffect.createWaveform(pattern, 0));
                } else {
                    vibrator.vibrate(pattern, 0);
                }
            }
        } catch (Exception ignored) {}

        // 5. POST HIGH-PRIORITY HEADS-UP NOTIFICATION WITH FULL-SCREEN INTENT
        try {
            Intent fullScreenIntent = new Intent(this, MainActivity.class);
            fullScreenIntent.addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK |
                Intent.FLAG_ACTIVITY_CLEAR_TOP |
                Intent.FLAG_ACTIVITY_SINGLE_TOP
            );
            fullScreenIntent.putExtra("aegis_emergency_siren", true);
            fullScreenIntent.putExtra("aegis_message", message);

            PendingIntent pi = PendingIntent.getActivity(
                this, 1002, fullScreenIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
            );

            NotificationCompat.Builder alertBuilder = new NotificationCompat.Builder(this, CHANNEL_SIREN)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle("🚨 CRITICAL EVACUATION SIREN ACTIVE")
                .setContentText(message)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(message))
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setFullScreenIntent(pi, true)
                .setAutoCancel(false)
                .setOngoing(true);

            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                nm.notify(NOTIF_SIREN_ID, alertBuilder.build());
            }

            // Launch Activity to pop up directly over the lockscreen
            startActivity(fullScreenIntent);
        } catch (Exception ignored) {}
    }

    private void startNativeSirenTone() {
        try {
            stopNativeSirenTone();
            int sampleRate = 22050;
            int numSamples = sampleRate * 2;
            short[] buffer = new short[numSamples];

            for (int i = 0; i < numSamples; i++) {
                double t = (double) i / sampleRate;
                double freq = 750.0 + 500.0 * Math.abs(Math.sin(Math.PI * 2.0 * t * 1.5));
                double sample = Math.sin(2.0 * Math.PI * freq * t) * 32767.0 * 0.95;
                buffer[i] = (short) Math.max(-32768, Math.min(32767, (int) sample));
            }

            sirenAudioTrack = new AudioTrack(
                AudioManager.STREAM_ALARM,
                sampleRate,
                AudioFormat.CHANNEL_OUT_MONO,
                AudioFormat.ENCODING_PCM_16BIT,
                buffer.length * 2,
                AudioTrack.MODE_STATIC
            );
            sirenAudioTrack.write(buffer, 0, buffer.length);
            sirenAudioTrack.setLoopPoints(0, buffer.length, -1);
            sirenAudioTrack.play();
        } catch (Exception ignored) {}
    }

    private synchronized void stopNativeSirenTone() {
        try {
            if (sirenAudioTrack != null) {
                try {
                    sirenAudioTrack.pause();
                    sirenAudioTrack.flush();
                } catch (Exception ignored) {}
                try {
                    sirenAudioTrack.stop();
                } catch (Exception ignored) {}
                try {
                    sirenAudioTrack.release();
                } catch (Exception ignored) {}
                sirenAudioTrack = null;
            }
        } catch (Exception ignored) {}
    }

    public synchronized void stopEmergencySiren() {
        isSirenActive = false;
        stopNativeSirenTone();

        try {
            if (vibrator != null) {
                vibrator.cancel();
            }
        } catch (Exception ignored) {}

        try {
            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                nm.cancel(NOTIF_SIREN_ID);
            }
        } catch (Exception ignored) {}
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        isRunning = false;
        stopEmergencySiren();
        if (cpuWakeLock != null && cpuWakeLock.isHeld()) {
            cpuWakeLock.release();
        }
    }
}
