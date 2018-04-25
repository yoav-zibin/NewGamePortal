import { checkCondition, checkNotNull } from '../globals';
import { store, dispatch } from '../stores';
import { ourFirebase } from './firebase';
require('webrtc-adapter/out/adapter_no_edge.js');

// Signalling using firebase.
// We send messages to a user by writing SignalData to
// gamePortal/gamePortalUsers/$userId/privateButAddable/signal/$signalId
// And the target user will read the signals and delete them after reading them.
const SDP1 = 'sdp1';
const SDP2 = 'sdp2';
const CANDIDATE = 'candidate';
type SignalType = 'sdp1' | 'sdp2' | 'candidate';

type SignalMsg = fbr.SignalEntry;

interface VideoNameElement {
  video: HTMLVideoElement;
  name: HTMLDivElement;
}

export namespace videoChat {
  interface UserIdToSignals {
    [userId: string]: SignalMsg[];
  }
  interface UserIdToPeerConnection {
    [userId: string]: MyPeerConnection;
  }
  const waitingSignals: UserIdToSignals = {};

  let localMediaStream: MediaStream | null = null;
  let localVideoElement: VideoNameElement;

  let opponentUserIds: string[] = [];
  let remoteVideoElements: VideoNameElement[];

  const peerConnections: UserIdToPeerConnection = {};

  const configuration = {
    iceServers: [
      {
        urls: 'stun:stun.l.google.com:19302'
      }
    ]
  };
  if ('fetch' in window) {
    console.log('Adding xirsys turn&ice servers');
    fetch('https://global.xirsys.net/_turn/GamePortal/', {
      method: 'PUT',
      body: '',
      headers: new Headers({
        Authorization:
          'Basic ' + btoa('yoavzibin:ffca05a6-372c-11e8-b68d-bdfb507d2f2f')
      })
    })
      .then(res => res.json())
      .catch(error => console.error('Error:', error))
      .then(response => {
        if (!response || !response.v || !response.v.iceServers) {
          console.warn('xirsys returned illegal reponse:', response);
          return;
        }
        const iceServers = response.v.iceServers;
        console.log('Success:', response, 'ICE List: ', iceServers);
        configuration.iceServers = configuration.iceServers.concat(iceServers);
      });
  }

  let _isSupported =
    !!(<any>window).RTCPeerConnection &&
    !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

  export function isSupported() {
    return _isSupported;
  }

  export function updateIsSupported() {
    _isSupported =
      !!(<any>window).RTCPeerConnection &&
      !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  export function stopUserMedia() {
    if (!localMediaStream) {
      return;
    }
    localMediaStream.getVideoTracks()[0].stop();
  }
  export function getUserMedia() {
    if (!_isSupported) {
      return Promise.resolve();
    }
    if (localMediaStream) {
      console.log('Already has localMediaStream.');
      return Promise.resolve();
    }
    console.log('Requesting getUserMedia...');
    return navigator.mediaDevices
      .getUserMedia({
        audio: true,
        video: {
          facingMode: 'user',
          width: 150,
          height: 150
        }
      })
      .then(
        stream => {
          console.log('getUserMedia response: ', stream);
          localMediaStream = stream;
        },
        err => {
          _isSupported = false;
          console.error('Error in getUserMedia: ', err);
        }
      );
  }

  export function updateOpponents(_opponentIds: string[]) {
    console.log('updateOpponents:', _opponentIds);
    const oldOpponentIds = opponentUserIds;
    opponentUserIds = _opponentIds.slice();
    let index = 0;
    localVideoElement = getVideoElement(index++);
    setVideoStream(localVideoElement, checkNotNull(localMediaStream!));

    // Close old connections that aren't going to be reused.
    for (let oldUserId of oldOpponentIds) {
      if (opponentUserIds.indexOf(oldUserId) === -1) {
        closeMyPeerConnection(oldUserId);
      }
    }

    // Create/reuse connections.
    remoteVideoElements = [];
    for (let userId of opponentUserIds) {
      const remoteVideoElement = getVideoElement(index++);
      remoteVideoElements.push(remoteVideoElement);
      const oldPeerConnection = peerConnections[userId];
      if (oldPeerConnection && oldOpponentIds.indexOf(userId) !== -1) {
        // reuse and set video stream
        const stream = oldPeerConnection.getRemoteStream();
        if (stream) {
          receivedVideoStream(userId, stream);
        } else {
          showUserName(userId);
        }
      } else {
        createMyPeerConnection(userId, waitingSignals[userId]);
        delete waitingSignals[userId];
      }
    }
  }

  function restartPeerConnection(userId: string) {
    showUserName(userId);
    setTimeout(() => createMyPeerConnection(userId, []), 1000);
  }

  function closeMyPeerConnection(userId: string) {
    if (peerConnections[userId]) {
      peerConnections[userId].close();
    }
    delete peerConnections[userId];
  }

  // See:
  // https://www.html5rocks.com/en/tutorials/webrtc/basics/
  class MyPeerConnection {
    private isCaller: boolean;
    private gotSdp: boolean;
    private isClosed: boolean = false;
    private pc: RTCPeerConnection;
    private remoteStream: MediaStream | null = null;

    constructor(public targetUserId: string, initialSignals: SignalMsg[]) {
      console.log('MyPeerConnection: initialSignals=', initialSignals);
      const pc = new RTCPeerConnection(configuration);
      this.pc = pc;
      pc.addStream(checkNotNull(localMediaStream!));

      // send any ice candidates to the other peer
      pc.onicecandidate = evt => {
        if (this.isClosed) {
          console.warn('onicecandidate after close');
          return;
        }
        console.log('onicecandidate: ', evt);
        if (evt.candidate) {
          this.sendSignal(CANDIDATE, evt.candidate);
        }
      };

      // once remote stream arrives, show it in the remote video element
      const addedStream = (stream: MediaStream) => {
        if (this.isClosed) {
          console.warn('onaddstream after close');
          return;
        }
        this.remoteStream = stream;
        receivedVideoStream(this.targetUserId, stream);
      };
      if ('ontrack' in pc) {
        (<any>pc).ontrack = (event: any) => {
          console.log('ontrack: ', event);
          addedStream(event.streams[0]);
        };
      } else {
        pc.onaddstream = event => {
          console.log('onaddstream: ', event);
          if (event.stream) {
            addedStream(event.stream);
          }
        };
      }

      const stateChangeHandler = (connectionState: string) => {
        if (this.isClosed) {
          return;
        }
        if (
          connectionState === 'failed' ||
          connectionState === 'disconnected' ||
          connectionState === 'closed'
        ) {
          this.close();
          restartPeerConnection(this.targetUserId);
        }
      };
      pc.oniceconnectionstatechange = evt => {
        console.log('oniceconnectionstatechange: ', evt);
        stateChangeHandler(pc.iceConnectionState);
      };
      if ('onconnectionstatechange' in pc) {
        const anyPc = <any>pc;
        anyPc.onconnectionstatechange = (evt: any) => {
          console.log('onconnectionstatechange: ', evt);
          stateChangeHandler(anyPc.connectionState);
        };
      }

      const isCaller = !initialSignals || initialSignals.length === 0;
      this.isCaller = isCaller;
      if (isCaller) {
        pc.createOffer().then(this.gotDescription.bind(this), err => {
          console.error('Error in createOffer: ', err);
        });
      } else {
        checkCondition(SDP1, initialSignals[0].signalType === SDP1);
        // DOMException: CreateAnswer can't be called before SetRemoteDescription.
        for (let signal of initialSignals) {
          this.receivedMessage(signal);
        }
        pc.createAnswer().then(this.gotDescription.bind(this), err => {
          console.error('Error in createAnswer: ', err);
        });
      }
    }

    sendSignal(signalType: SignalType, signal: any) {
      ourFirebase.sendSignal(
        this.targetUserId,
        signalType,
        JSON.stringify(signal)
      );
    }

    didGetSdp() {
      return this.gotSdp;
    }
    getIsCaller() {
      return this.isCaller;
    }
    getRemoteStream() {
      return this.remoteStream;
    }
    close() {
      this.isClosed = true;
      this.remoteStream = null;
      this.pc.close();
    }

    gotDescription(desc: any) {
      console.log('gotDescription: ', desc);
      this.pc.setLocalDescription(desc).then(
        () => {
          console.log('setLocalDescription success');
        },
        err => {
          console.error('Error in setLocalDescription: ', err);
        }
      );
      this.sendSignal(this.isCaller ? SDP1 : SDP2, desc);
    }

    canReceiveMessage(signalType: SignalType) {
      switch (signalType) {
        case SDP2:
        case SDP1:
          return !this.gotSdp && signalType === (this.isCaller ? SDP2 : SDP1);
        case CANDIDATE:
          return this.gotSdp;
        default:
          throw new Error('signalType2=' + signalType);
      }
    }
    receivedMessage(signalMsg: SignalMsg) {
      console.log('receivedMessage signalMsg=', signalMsg);
      const signalType: SignalType = signalMsg.signalType;
      checkCondition('canReceiveMessage', this.canReceiveMessage(signalType));
      const signalData: any = JSON.parse(signalMsg.signalData);
      switch (signalType) {
        case SDP2:
        case SDP1:
          this.gotSdp = true;
          this.pc.setRemoteDescription(signalData).then(
            () => {
              console.log('setRemoteDescription success');
            },
            err => {
              console.error('Error in setRemoteDescription: ', err);
            }
          );
          break;
        case CANDIDATE:
          this.pc.addIceCandidate(new RTCIceCandidate(signalData)).then(
            () => {
              console.log('addIceCandidate success');
            },
            err => {
              console.error('Error in addIceCandidate: ', err);
            }
          );
          break;
        default:
          throw new Error('signalType3=' + signalType);
      }
    }
  }

  function createMyPeerConnection(userId: string, signals: SignalMsg[]) {
    if (opponentUserIds.indexOf(userId) === -1) {
      console.warn(
        'createMyPeerConnection for non-opponent',
        opponentUserIds,
        userId
      );
      return;
    }
    showUserName(userId);
    console.log(
      'createMyPeerConnection targetUserId=',
      userId,
      ' signals=',
      signals
    );
    closeMyPeerConnection(userId);
    peerConnections[userId] = new MyPeerConnection(userId, signals);
  }

  function receivedVideoStream(userId: string, stream: MediaStream) {
    setVideoStream(getRemoteVideoElement(userId), stream);
  }

  function getRemoteVideoElement(userId: string) {
    const index = opponentUserIds.indexOf(userId);
    checkCondition('getRemoteVideoElement', index !== -1);
    return remoteVideoElements[index];
  }

  function receivedMessage(signal: SignalMsg) {
    const uid = signal.addedByUid;
    const existingSignals = waitingSignals[uid];
    const peerConnection = peerConnections[uid];
    const signalType: SignalType = signal.signalType;
    if (peerConnection) {
      if (peerConnection.canReceiveMessage(signalType)) {
        peerConnection.receivedMessage(signal);
      } else {
        // We either drop the signal or create a new peerConnection
        if (signalType === SDP1) {
          console.warn('Got SDP1, so creating new connection');
          createMyPeerConnection(uid, [signal]);
        } else {
          console.warn('Dropping signal', signal);
        }
      }
      return;
    }

    switch (signalType) {
      case SDP2:
        console.warn('Throwing away SDP2:', signal);
        break;
      case SDP1:
        if (existingSignals) {
          console.warn('Throwing away signals=', existingSignals);
        }
        waitingSignals[uid] = [signal];
        break;
      case CANDIDATE:
        if (!existingSignals) {
          console.warn('Throwing away candidate:', signal);
        } else {
          existingSignals.push(signal);
        }
        break;
      default:
        throw new Error('signalType=' + signalType);
    }
  }

  store.subscribe(() => {
    const signals = store.getState().signals;
    if (signals.length === 0) {
      return;
    }
    for (let signal of signals) {
      receivedMessage(signal);
    }
    dispatch({ setSignals: [] });
  });

  function getElementById(id: string): HTMLElement {
    return checkNotNull(document.getElementById(id)!);
  }
  function getVideoElement(index: number): VideoNameElement {
    const video = <HTMLVideoElement>getElementById('videoElement' + index);
    // TODO: add phonegap ios stuff
    (<any>video).autoplay = 'true';
    const div = <HTMLDivElement>getElementById('videoParticipantName' + index);
    return { video: video, name: div };
  }

  function showUserName(userId: string) {
    setVideoOrNameVisible(getRemoteVideoElement(userId), false);
  }
  function setVideoOrNameVisible(
    videoName: VideoNameElement,
    isVideoVisible: boolean
  ) {
    console.log(isVideoVisible ? 'Showing video' : 'Showing name');
    const { video, name } = videoName;
    video.style.display = isVideoVisible ? 'inline' : 'none';
    name.style.display = isVideoVisible ? 'none' : 'table';
  }
  function setVideoStream(videoName: VideoNameElement, stream: MediaStream) {
    setVideoOrNameVisible(videoName, true);
    const { video, name } = videoName;
    if ('srcObject' in video) {
      video.srcObject = stream;
    } else {
      (<any>video).src = window.URL
        ? window.URL.createObjectURL(stream)
        : stream;
    }
    if ('getVideoTracks' in stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if ('getSettings' in videoTrack) {
        const settings = videoTrack.getSettings();
        if (settings.width && settings.height) {
          const width = settings.width + 'px';
          const height = settings.height + 'px';
          setWidthHeight(video, width, height);
          setWidthHeight(name, width, height);
        }
      }
    }
    // tell the plugin to handle your video tag manually
    window.cordova.plugins.iosrtc.observeVideo(video); 
  }

  function setWidthHeight(elem: HTMLElement, width: string, height: string) {
    const style = elem.style;
    style.width = width;
    style.height = height;
    style.minWidth = width;
    style.minHeight = height;
    style.maxWidth = width;
    style.maxHeight = height;
  }
}
