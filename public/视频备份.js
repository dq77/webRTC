// getting dom elements
var divSelectRoom = document.getElementById("selectRoom");
var divConsultingRoom = document.getElementById("consultingRoom");
var inputRoomNumber = document.getElementById("roomNumber");
var btnGoRoom = document.getElementById("goRoom");
var localVideo = document.getElementById("localVideo");
var localName = document.getElementById("localName");
var remoteVideo1 = document.getElementById("remoteVideo1");
var remoteVideo2 = document.getElementById("remoteVideo2");
var remoteVideo3 = document.getElementById("remoteVideo3");
var remoteName1 = document.getElementById("remoteName1");
var remoteName2 = document.getElementById("remoteName2");
var remoteName3 = document.getElementById("remoteName3");

// variables
var roomNumber;
var localStream;
var remoteStream = [];
var rtcPeerConnection;
var iceServers = {
    'iceServers': [
        { urls: 'stun:172.245.156.24:3478' },
        {
            urls: 'turn:172.245.156.24:3478',
            username: 'diaoqi',
            credential: '99999999'
        }
    ]
}
var streamConstraints = { audio: true, video: false };
var isCaller;

// Let's do this
var socket = io();

btnGoRoom.onclick = function () {
    roomNumber = 2;
    socket.emit('create or join', roomNumber);
    divSelectRoom.style = "display: none;";
};

// 服务器返回 房间已创建消息 我是创建者
socket.on('created', function (roomNumber) {
    navigator.mediaDevices.getUserMedia(streamConstraints).then(function (stream) {
        // var videoTrack = stream.getVideoTracks()[0];
        // var newConstraints = {
        //     width: { max: 80 },
        //     height: { max: 60 }
        // };
        // videoTrack.applyConstraints(newConstraints)
        //     .then(function() {
        //     })
        localStream = stream;
        localVideo.srcObject = stream;
        localName.style.display = 'block';
        isCaller = true;
    }).catch(function (err) {
        console.log('An error ocurred when accessing media devices', err);
    });
});

// 服务器返回 房间已加入消息 我是加入者
socket.on('joined', function (roomNumber) {
    navigator.mediaDevices.getUserMedia(streamConstraints).then(function (stream) {
        // var videoTrack = stream.getVideoTracks()[0];
        // var newConstraints = {
        //     width: { max: 80 },
        //     height: { max: 60 }
        // };
        // videoTrack.applyConstraints(newConstraints)
        //     .then(function() {
        //     })
        localStream = stream;
        localVideo.srcObject = stream;
        localName.style.display = 'block';
        socket.emit('ready', roomNumber);
    }).catch(function (err) {
        console.log('An error ocurred when accessing media devices', err);
    });
});

socket.on('candidate', function (event) {
    var candidate = new RTCIceCandidate({
        sdpMLineIndex: event.label,
        candidate: event.candidate
    });
    rtcPeerConnection.addIceCandidate(candidate);
});

socket.on('ready', function () {
    if (isCaller) {
        rtcPeerConnection = new RTCPeerConnection(iceServers);
        rtcPeerConnection.onicecandidate = onIceCandidate;
        rtcPeerConnection.ontrack = onAddStream;
        rtcPeerConnection.addTrack(localStream.getAudioTracks()[0], localStream);
        // rtcPeerConnection.addTrack(localStream.getTracks()[1], localStream);
        rtcPeerConnection.createOffer()
            .then(sessionDescription => {
                rtcPeerConnection.setLocalDescription(sessionDescription);
                socket.emit('offer', {
                    type: 'offer',
                    sdp: sessionDescription,
                    room: roomNumber
                });
            })
            .catch(error => {
                console.log(error)
            })
    }
});

socket.on('offer', function (event) {
    if (!isCaller) {
        rtcPeerConnection = new RTCPeerConnection(iceServers);
        rtcPeerConnection.onicecandidate = onIceCandidate;
        rtcPeerConnection.ontrack = onAddStream;
        rtcPeerConnection.addTrack(localStream.getAudioTracks()[0], localStream);
        // rtcPeerConnection.addTrack(localStream.getTracks()[1], localStream);
        rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
        rtcPeerConnection.createAnswer()
            .then(sessionDescription => {
                rtcPeerConnection.setLocalDescription(sessionDescription);
                socket.emit('answer', {
                    type: 'answer',
                    sdp: sessionDescription,
                    room: roomNumber
                });
            })
            .catch(error => {
                console.log(error)
            })
    }
});

socket.on('answer', function (event) {
    rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
})

// handler functions
function onIceCandidate(event) {
    if (event.candidate) {
        console.log('sending ice candidate');
        socket.emit('candidate', {
            type: 'candidate',
            label: event.candidate.sdpMLineIndex,
            id: event.candidate.sdpMid,
            candidate: event.candidate.candidate,
            room: roomNumber
        })
    }
}

function onAddStream(event) {
    var hasStream = false;
    remoteStream.forEach(item => {
        if (item.id == event.streams[0].id) {
            hasStream = true;
        }
    })
    if (hasStream) {
        return;
    }
    
    if (remoteVideo2.srcObject) {
        remoteVideo3.srcObject = event.streams[0];
        remoteName3.style.display = 'block'
    } else if (remoteVideo1.srcObject) {
        remoteVideo2.srcObject = event.streams[0];
        remoteName2.style.display = 'block'
    } else {
        remoteVideo1.srcObject = event.streams[0];
        remoteName1.style.display = 'block'
    }
    remoteStream.push(event.streams[0])
    console.log('-----------');
    console.log(remoteVideo1);
    console.log(remoteVideo2);
    console.log(remoteVideo3);
    console.log('-----------');
}

function getDeviceType() {
    const UA = navigator.userAgent
    var isIphone = UA.match(/iphone/i) == 'iphone';
    var isHuawei = UA.match(/huawei/i) == 'huawei';
    var isHonor = UA.match(/honor/i) == 'honor';
    var isOppo = UA.match(/oppo/i) == 'oppo';
    var isOppoR15 = UA.match(/pacm00/i) == 'pacm00';
    var isVivo = UA.match(/vivo/i) == 'vivo';
    var isXiaomi = UA.match(/mi\s/i) == 'mi ';
    var isXiaomi2s = UA.match(/mix\s/i) == 'mix ';
    var isRedmi = UA.match(/redmi/i) == 'redmi';
    var isSamsung = UA.match(/sm-/i) == 'sm-';
    var isLG = UA.match(/lg/i) == 'lg';
    if (isIphone) {
      return 'iPhone';
    } else if (isHuawei || isHonor) {
      return 'Huawei';
    } else if (isOppo || isOppoR15) {
      return 'Oppo';
    } else if (isVivo) {
      return 'vivo';
    } else if (isXiaomi || isRedmi || isXiaomi2s) {
      return 'mi';
    } else if (isSamsung) {
      return 'Samsung';
    } else if (isLG) {
      return 'LG';
    } else {
      return '设备';
    }
}
