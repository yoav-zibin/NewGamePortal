import { ourFirebase } from './firebase';
import * as firebase from 'firebase';
import { isIos, isAndroid } from '../globals';

export const initPushNotification = () => {
  const messaging = ourFirebase.getMessaging();
  if (messaging === null) {
    return;
  }
  if (isIos || isAndroid) {
    console.log('Mobile Device Logged In');
  } else {
    // @ts-ignore
    messaging
      .requestPermission()
      .then(() => {
        return messaging.getToken();
      })
      .then(token => {
        console.log('Notification permission granted :)' + token);
        ourFirebase.addFcmToken(token, 'web');
      })
      .catch(error => {
        console.log('Notification permission denied :/' + error);
      });
    messaging.onTokenRefresh(function() {
      // @ts-ignore
      messaging
        .getToken()
        .then(refreshedToken => {
          if (firebase.auth().currentUser) {
            ourFirebase.addFcmToken(refreshedToken, 'web');
          }
        })
        .catch(error => {
          console.log('Unable to retrieve refreshed token ', error);
        });
    });
  }
};
