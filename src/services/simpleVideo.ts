import { isIos } from '../globals';

// tslint:disable
const configuration = {
    'iceServers': [{
        'urls': 'stun:stun.l.google.com:19302'
    }]
};
const pc1 = new RTCPeerConnection(configuration);
const pc2 = new RTCPeerConnection(configuration);
let localStream: MediaStream;

console.log('Requesting getUserMedia...');
navigator.mediaDevices.getUserMedia({
    "audio": true,
    "video": {
        facingMode: "user", width: 150, height: 150
    }
})
    .then(
        (_localStream) => {
            localStream = _localStream;
            console.log("getUserMedia response: ", localStream);
            setVideoStream('localVideo', localStream);
            createPCs(localStream);
        }
    );

function setVideoStream(videoId: string, stream: MediaStream) {
    const video: HTMLVideoElement = <HTMLVideoElement>document.getElementById(videoId)!;
    video.srcObject = stream;
    if (isIos) {
        window.cordova.plugins.iosrtc.observeVideo(video);
    }
}
function createPCs(localStream: MediaStream) {
    pc1.addStream(localStream);
    pc1.onicecandidate = (evt) => onicecandidate(pc2, evt);
    pc2.onicecandidate = (evt) => onicecandidate(pc1, evt);
    pc1.onaddstream = (evt) => onaddstream(pc1, evt);
    pc2.onaddstream = (evt) => onaddstream(pc2, evt);

    pc1.createOffer().then((desc) => gotDescription(true, pc1, pc2, desc));
}
function onicecandidate(targetPC: RTCPeerConnection, evt: RTCPeerConnectionIceEvent) {
    console.log("onicecandidate: ", evt);
    if (evt.candidate) {
        targetPC.addIceCandidate(new RTCIceCandidate(<any>evt.candidate)).then(
            () => { console.log("addIceCandidate success"); },
            (err: any) => { console.error("Error in addIceCandidate: ", err); }
        );
    }
}
function onaddstream(myPC: RTCPeerConnection, evt: MediaStreamEvent) {
    console.log("onaddstream: ", evt);
    if (evt.stream) {
        if (myPC == pc1) throw new Error("Internal bug");
        setVideoStream('pcVideo', evt.stream);
    }
}
function gotDescription(isOffer: boolean, myPC: RTCPeerConnection, targetPC: RTCPeerConnection, desc: any) {
    console.log("gotDescription: ", desc);
    myPC.setLocalDescription(desc).then(
        () => { console.log("setLocalDescription success"); },
        (err: any) => { console.error("Error in setLocalDescription: ", err); }
    );

    targetPC.setRemoteDescription(<any>new RTCSessionDescription(desc)).then(
        () => { console.log("setRemoteDescription success"); },
        (err: any) => { console.error("Error in setRemoteDescription: ", err); }
    );
    if (isOffer) {
        targetPC.createAnswer().then((desc) => gotDescription(false, pc2, pc1, desc));
    }
}