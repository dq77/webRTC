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
        initStream(stream)
        isCaller = true;
    }).catch(function (err) {
        console.log('An error ocurred when accessing media devices', err);
    });
});

// 服务器返回 房间已加入消息 我是加入者
socket.on('joined', function (roomNumber) {
    navigator.mediaDevices.getUserMedia(streamConstraints).then(function (stream) {
        initStream(stream)
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
    console.log('ready事件');
    if (isCaller) {
        rtcPeerConnection = new RTCPeerConnection(iceServers);
        rtcPeerConnection.onicecandidate = onIceCandidate;
        rtcPeerConnection.ontrack = onAddStream;
        rtcPeerConnection.addTrack(localStream.getAudioTracks()[0], localStream);
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
    console.log('offer事件');
    if (!isCaller) {
        rtcPeerConnection = new RTCPeerConnection(iceServers);
        rtcPeerConnection.onicecandidate = onIceCandidate;
        rtcPeerConnection.ontrack = onAddStream;
        rtcPeerConnection.addTrack(localStream.getAudioTracks()[0], localStream);
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
    console.log('新来一个');
}

function initStream(stream) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    // 创建源节点，并将其连接到音频流
    const source = audioContext.createMediaStreamSource(stream);
    // 创建分析器节点
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256; // 设置FFT大小
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    // 将源节点和分析器节点连接起来
    source.connect(analyser);
    // 分析音频数据
    function checkAudioActivity() {
        analyser.getByteFrequencyData(dataArray);
        // 计算音频信号的活跃度
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
        }
        let average = sum / bufferLength;
        // 设置一个阈值来判断是否有人在说话
        const threshold = 30; // 这个阈值可能需要根据实际情况调整
        if (average > threshold) {
            if (!localName.classList.contains('active')) {
                localName.classList.add('active');
            }
        } else {
            if (localName.classList.contains('active')) {
                localName.classList.remove('active');
            }
        }
        // 每隔一段时间检查一次
        setTimeout(checkAudioActivity, 200);
    }
    
    // 开始分析
    checkAudioActivity();
    localStream = stream;
    localVideo.srcObject = stream;
    localName.style.display = 'block';
}
