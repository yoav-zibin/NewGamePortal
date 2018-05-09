/*
import { ourFirebase } from './firebase';
import { isApp } from '../globals';

export const initPushNotification = () => {
  if (isApp) {
    console.log('Mobile Device Logged In');
    return;
  }
  const messaging = ourFirebase.getMessaging();
  if (messaging === null) {
    return;
  }
  const perm = messaging.requestPermission();
  if (perm) {
    perm
      .then(() => {
        return messaging.getToken();
      })
      .then(token => {
        console.log('Notification permission granted :)' + token);
        if (token) {
          ourFirebase.addFcmToken(token, 'web');
        }
      })
      .catch(error => {
        console.log('Notification permission denied :/' + error);
      });
  }
  messaging.onTokenRefresh(function() {
    messaging
      .getToken()
      .then(refreshedToken => {
        console.log('refreshedToken=' + refreshedToken);
        if (refreshedToken) {
          ourFirebase.addFcmToken(refreshedToken, 'web');
        }
      })
      .catch(error => {
        console.log('Unable to retrieve refreshed token ', error);
      });
  });
};
*/
