import { ourFirebase } from './firebase';
import { platform } from '../globals';

export const initPushNotification = () => {
  const messaging: firebase.messaging.Messaging = ourFirebase.getMessaging();  
  messaging
    .requestPermission()!
    .then(() => {
      return messaging.getToken();
    })
    .then(token => {
      console.log('notification permission granted :)' + token);
      if (platform !== 'tests') {
        ourFirebase.addFcmToken(token, platform);
      }
    })
    .catch(error => {
      console.log('Notification permission denied :/' + error);
    });
};
