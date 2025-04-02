package com.poclocationgather;

import android.content.Intent;
import android.os.Build;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class ForegroundHeadlessModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext reactContext;

    public ForegroundHeadlessModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @NonNull
    @Override
    public String getName() {
        return "ForegroundHeadlessModule";
    }

    @ReactMethod
    public void startService() {
        Intent serviceIntent = new Intent(reactContext, ForegroundHeadlessService.class);
        serviceIntent.setAction("START_FOREGROUND");

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            this.reactContext.startForegroundService(serviceIntent);
        } else {
            this.reactContext.startService(serviceIntent);
        }
    }

    @ReactMethod
    public void stopService() {
        Intent serviceIntent = new Intent(reactContext, ForegroundHeadlessService.class);
        serviceIntent.setAction("STOP_FOREGROUND");
        this.reactContext.stopService(serviceIntent);
    }
}
