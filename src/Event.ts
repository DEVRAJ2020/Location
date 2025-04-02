import AsyncStorage from '@react-native-async-storage/async-storage';

export default class Event {
  taskId: string;
  isHeadless: boolean;
  timestamp: string;
  location: string;
  key: string;

  static destroyAll() {
    AsyncStorage.setItem('events', JSON.stringify([]));
  }

  static async create(taskId: string, isHeadless: boolean, loc?: string) {
    const event = new Event(taskId, isHeadless, undefined, loc);

    // Persist event into AsyncStorage.
   await AsyncStorage.getItem('events')
      .then(async json => {
        const data = json === null ? [] : JSON.parse(json);
        data.push(event.toJson());
      await AsyncStorage.setItem('events', JSON.stringify(data));
      })
      .catch(error => {
        console.error('Event.create error: ', error);
      });
    return event;
  }

  static async all() {
    return new Promise(async (resolve, reject) => {
      await AsyncStorage.getItem('events')
        .then(json => {
          const data = json === null ? [] : JSON.parse(json);
          resolve(
            data.map((record: any) => {
              return new Event(
                record.taskId,
                record.isHeadless,
                record.timestamp,
                record.loc,
              );
            }),
          );
        })
        .catch(error => {
          console.error('Event.create error: ', error);
          reject(error);
        });
    });
  }

  constructor(
    taskId: string,
    isHeadless: boolean,
    timestamp?: string,
    loc?: string,
  ) {
    if (!timestamp) {
      const now: Date = new Date();
      timestamp = now.toLocaleDateString() + ' ' + now.toLocaleTimeString();
    }
    if (!loc) {
      loc = 'not available';
    }

    this.taskId = taskId;
    this.isHeadless = isHeadless;
    this.timestamp = timestamp;
    this.location = loc;
    this.key = `${this.taskId}-${this.timestamp}`;
  }

  toJson() {
    return {
      taskId: this.taskId,
      timestamp: this.timestamp,
      isHeadless: this.isHeadless,
      loc: this.location,
    };
  }
}
