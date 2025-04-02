package com.poclocationgather;

import android.content.Intent;
import android.os.Bundle;

import com.facebook.react.HeadlessJsTaskService;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.jstasks.HeadlessJsTaskConfig;

import java.util.concurrent.TimeUnit;

import javax.annotation.Nullable;

public class GeolocationHeadlessTask extends HeadlessJsTaskService {
    @Override
    protected @Nullable HeadlessJsTaskConfig getTaskConfig(Intent intent) {
        Bundle extras = intent.getExtras();
        return new HeadlessJsTaskConfig(
                "GeolocationBackgroundTask",
                extras != null ? Arguments.fromBundle(extras) : Arguments.createMap(),
                TimeUnit.MINUTES.toMillis(5),
                true
        );
    }
}
