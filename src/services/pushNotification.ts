import { ourFirebase } from './firebase';

export const initPushNotification = () => {
  const messaging: firebase.messaging.Messaging = ourFirebase.getMessaging();
  if (messaging === null) {
    return;
  }
  // @ts-ignore
  messaging
    .requestPermission()
    .then(() => {
      return messaging.getToken();
    })
    .then(token => {
      console.log('notification permission granted :)' + token);
      ourFirebase.addFcmToken(token, 'ios');
    })
    .catch(error => {
      console.log('Notification permission denied :/' + error);
    });
};
