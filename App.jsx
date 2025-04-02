/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * Generated with the TypeScript template
 * https://github.com/react-native-community/react-native-template-typescript
 *
 * @format
 */

import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Switch,
  Button,
  Alert,
  PermissionsAndroid,
  NativeModules,
  FlatList,
} from 'react-native';

import BackgroundFetch from 'react-native-background-fetch';
import Geolocation from '@react-native-community/geolocation';

const {ForegroundHeadlessModule} = NativeModules;

const Colors = {
  gold: '#fedd1e',
  black: '#000',
  white: '#fff',
  lightGrey: '#ccc',
  blue: '#337AB7',
  brick: '#973920',
};

/// Util class for handling fetch-event peristence in AsyncStorage.
import Event from './src/Event';
import AsyncStorage from '@react-native-async-storage/async-storage';

Geolocation.setRNConfiguration({
  skipPermissionRequests: true,
  locationProvider: 'auto',
});

console.log("NativeModules", NativeModules);

const requestPermissions = async () => {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Need permission to access location',
        message: 'Location access is needed so we can track your location!',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      }
    );
    const granted2 = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
      {
        title: 'Need permission to access location',
        message: 'Location access is needed so we can track your location!',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      }
    );
    if (
      granted === PermissionsAndroid.RESULTS.GRANTED &&
      granted2 === PermissionsAndroid.RESULTS.GRANTED
    ) {
      console.log('You can use the location');
    } else {
      console.log('Location permission denied');
    }
  } catch (err) {
    console.warn(err);
  }
};

function geoLocationPromise() {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      info => {
        console.log(info);
        resolve(info);
      },
      error => {
        console.log(error);
        reject(error);
      },
      {
        timeout: 20000,
        maximumAge: 0,
        enableHighAccuracy: true,
      }
    );
  });
}

const App = () => {
  const [enabled, setEnabled] = React.useState(false);
  const [status, setStatus] = React.useState(-1);
  const [events, setEvents] = React.useState([]);
  const [lastDistance, setLastDistance] = useState([4,6]);

  React.useEffect(() => {
    async function asyncTask() {
      await requestPermissions();
      initBackgroundFetch();
      loadEvents();
    }

    asyncTask();
  }, []);

  React.useEffect(() => {
   setInterval(() => {
    GetLastDistance()
   }, 40000);
  }, []);

  const GetLastDistance = async () => {
    try {
      const result = await AsyncStorage.getItem('distance');
      if (result !== null) {
        console.log('lastDistance from AsyncStorage:', result);
        const distance = +result;
        setLastDistance(prevArray => [...prevArray, distance]);        
      } else {
        console.log('No lastDistance found in AsyncStorage');
      }
    } catch (err) {
      console.log('Could not get lastDistance:', err);
    }
  };

  const initBackgroundFetch = async () => {
    const status = await BackgroundFetch.configure(
      {
        minimumFetchInterval: 15,
        stopOnTerminate: false,
        enableHeadless: true,
        startOnBoot: false,
        forceAlarmManager: false,
        requiredNetworkType: BackgroundFetch.NETWORK_TYPE_NONE,
        requiresCharging: false,
        requiresDeviceIdle: false,
        requiresBatteryNotLow: false,
        requiresStorageNotLow: false,
      },
      async (taskId) => {
        console.log('[BackgroundFetch] taskId', taskId);

        if (taskId === 'react-native-background-fetch') {
          const event = await Event.create(taskId, false);
          setEvents(prev => [...prev, event]);
        }

        if (taskId === 'com.transistorsoft.customtask') {
          try {
            const locInfo = await geoLocationPromise();
            const event = await Event.create(
              taskId,
              false,
              `lat-${locInfo.coords.latitude};long-${locInfo.coords.longitude}`,
            );
            setEvents(prev => [...prev, event]);
          } catch (error) {
            if (error.message) {
              const event = await Event.create(taskId, false, `${error.message}`);
              setEvents(prev => [...prev, event]);
            } else {
              const event = await Event.create(taskId, false);
              setEvents(prev => [...prev, event]);
            }
          }
        }

        BackgroundFetch.finish(taskId);
      },
      (taskId) => {
        console.log('[Fetch] TIMEOUT taskId:', taskId);
        BackgroundFetch.finish(taskId);
      }
    );
    setStatus(status);
    setEnabled(true);
  };

  const loadEvents = () => {
    Event.all()
      .then(data => {
        setEvents(data);
      })
      .catch(error => {
        Alert.alert('Error', 'Failed to load data from AsyncStorage: ' + error);
      });
  };

  const onClickToggleEnabled = (value) => {
    setEnabled(value);

    if (value) {
      BackgroundFetch.start();
    } else {
      BackgroundFetch.stop();
    }
  };

  const onClickStatus = () => {
    BackgroundFetch.status().then((status) => {
      let statusConst = '';
      switch (status) {
        case BackgroundFetch.STATUS_AVAILABLE:
          statusConst = 'STATUS_AVAILABLE';
          break;
        case BackgroundFetch.STATUS_DENIED:
          statusConst = 'STATUS_DENIED';
          break;
        case BackgroundFetch.STATUS_RESTRICTED:
          statusConst = 'STATUS_RESTRICTED';
          break;
      }
      Alert.alert('BackgroundFetch.status()', `${statusConst} (${status})`);
    });
  };

  const onClickScheduleTask = () => {
    const delay = 30000;
    BackgroundFetch.scheduleTask({
      taskId: 'com.transistorsoft.customtask',
      stopOnTerminate: false,
      enableHeadless: true,
      delay: delay,
      forceAlarmManager: false,
      periodic: true,
    })
      .then(() => {
        Alert.alert(
          'scheduleTask',
          'Scheduled task with delay: ' + delay + 'ms',
        );
      })
      .catch(error => {
        Alert.alert('scheduleTask ERROR', error);
      });
  };

  const onClickClear = () => {
    Event.destroyAll();
    setEvents([]);
  };

  const renderEvents = () => {
    console.log("eveeeeeeeeee", events);
    
    if (!events.length) {
      return (
        <Text style={{padding: 10, fontSize: 16}}>
          {/* Waiting for BackgroundFetch events... */}
        </Text>
      );
    }
    return events
      .slice()
      .reverse()
      .map(event => (
        <View key={event.key} style={styles.event}>
          <View style={{flexDirection: 'row'}}>
            <Text style={styles.taskId}>
              {event.taskId}&nbsp;{event.isHeadless ? '[Headless]' : ''}
            </Text>
          </View>
          <Text style={styles.remark}>Remark - {event.location}</Text>
          <Text style={styles.timestamp}>{event.timestamp}</Text>
        </View>
      ));
  };

  async function onLocPress() {
    try {
      ForegroundHeadlessModule.startService();
      console.log('Did it run?');
     const watchId = await AsyncStorage.getItem('watchId');
     console.log('watch id found from asynchstorage', watchId);
    } catch (error) {
      if (error.message) {
        console.log(error.message);
      } else {
        console.log(error);
      }
    }
  }

  async function onLocStop() {
    ForegroundHeadlessModule.stopService();
    await AsyncStorage.getItem('watchId', (err, result) => {
      if (err) {
        console.log('Couldnt get WatchID', err);
        console.log("watchid from asynchstorage is", result);
        return;
      }

      console.log("watchid from asynchstorage is", result);

      if (result) {
        console.log("watchid from asynchstorage is", result);
        Geolocation.clearWatch(+result);
      }
    });
  }

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: Colors.gold}}>
      <StatusBar barStyle={'light-content'}></StatusBar>
      <View style={styles.container}>
        <View style={styles.toolbar}>
          <Text style={styles.title}>BGFetch Demo</Text>
          <Button title="Loc" onPress={onLocPress} />
          <Button title="Stop" onPress={onLocStop} />
          <Switch value={enabled} onValueChange={onClickToggleEnabled} />
        </View>

        <FlatList
          data={lastDistance}
          renderItem={({ item }) => 
            <View style={{backgroundColor: 'red'}}>
              <Text style={styles.event}>{item}</Text>
            </View>
          }
        />
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={styles.eventList}>
          {renderEvents()}
        </ScrollView>
        <View style={styles.toolbar}>
          <Button title={'status: ' + status} onPress={onClickStatus} />
          <Text>&nbsp;</Text>
          <Button title="scheduleTask" onPress={onClickScheduleTask} />
          <View style={{flex: 1}} />
          <Button title="clear" onPress={onClickClear} />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    flex: 1,
  },
  title: {
    fontSize: 24,
    flex: 1,
    fontWeight: 'bold',
    color: Colors.black,
  },
  eventList: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  event: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: Colors.lightGrey,
  },
  taskId: {
    color: Colors.blue,
    fontSize: 16,
    fontWeight: 'bold',
  },
  headless: {
    fontWeight: 'bold',
  },
  remark: {
    color: Colors.brick,
  },
  timestamp: {
    color: Colors.black,
  },
  toolbar: {
    height: 57,
    flexDirection: 'row',
    paddingLeft: 10,
    paddingRight: 10,
    alignItems: 'center',
    backgroundColor: Colors.gold,
  },
});

export default App;