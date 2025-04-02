package com.poclocationgather;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import com.facebook.react.HeadlessJsTaskService;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.jstasks.HeadlessJsTaskConfig;

public class ForegroundHeadlessService extends Service {

    private static final String TAG = "ForegroundHeadlessService";
    private static final String CHANNEL_ID = "location_channel";
    private static final int NOTIFICATION_ID = 1001;
    private static final long LOCATION_UPDATE_INTERVAL = 30000; // 30 seconds

    private Handler handler;
    private boolean isTaskRunning = false;
    private boolean shouldContinue = true;

    private final Runnable locationUpdateRunnable = new Runnable() {
        @Override
        public void run() {
            if (!shouldContinue) {
                return;
            }

            if (!isTaskRunning) {
                isTaskRunning = true;
                try {
                    Context context = getApplicationContext();
                    Log.d(TAG, "Starting location update task");
                    
                    // Start GeolocationHeadlessTask
                    Intent headlessTaskIntent = new Intent(context, GeolocationHeadlessTask.class);
                    context.startService(headlessTaskIntent);
                    
                    // Acquire wake lock
                    HeadlessJsTaskService.acquireWakeLockNow(context);
                } catch (Exception e) {
                    Log.e(TAG, "Error in location update task", e);
                } finally {
                    isTaskRunning = false;
                    
                    // Schedule next execution if service should continue
                    if (shouldContinue) {
                        handler.postDelayed(this, LOCATION_UPDATE_INTERVAL);
                    }
                }
            } else {
                Log.w(TAG, "Previous task still running, skipping this interval");
                if (shouldContinue) {
                    handler.postDelayed(this, LOCATION_UPDATE_INTERVAL);
                }
            }
        }
    };

    @Override
    public void onCreate() {
        super.onCreate();
        handler = new Handler();
        createNotificationChannel();
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        shouldContinue = false;
        handler.removeCallbacks(locationUpdateRunnable);
        Log.d(TAG, "Service destroyed");
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Location Service",
                    NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Background location service");
            NotificationManager manager = getSystemService(NotificationManager.class);
            manager.createNotificationChannel(channel);
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && intent.getAction() != null) {
            switch (intent.getAction()) {
                case "START_FOREGROUND":
                    Log.d(TAG, "Starting foreground service");
                    startForeground(NOTIFICATION_ID, createNotification());
                    shouldContinue = true;
                    handler.post(locationUpdateRunnable);
                    break;
                case "STOP_FOREGROUND":
                    Log.d(TAG, "Stopping foreground service");
                    shouldContinue = false;
                    stopForeground(true);
                    stopSelf();
                    break;
            }
        }
        return START_STICKY;
    }

    private Notification createNotification() {
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this,
                0,
                notificationIntent,
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
        );

        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Location Service")
                .setContentText("Gathering location in background")
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentIntent(pendingIntent)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setOngoing(true)
                .build();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}