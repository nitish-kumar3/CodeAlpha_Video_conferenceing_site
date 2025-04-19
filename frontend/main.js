const socket = io('/');
const videoGrid = document.getElementById('video-grid');
const myVideo = document.createElement('video');
myVideo.muted = true;

let myStream;
navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
  myStream = stream;
  addVideoStream(myVideo, stream);

  const myPeer = new Peer(undefined, {
    host: '/',
    port: '3001'
  });

  myPeer.on('open', id => {
    socket.emit('join-room', ROOM_ID, id);
  });

  socket.on('user-connected', userId => {
    const call = myPeer.call(userId, stream);
    const video = document.createElement('video');
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream);
    });
  });

  myPeer.on('call', call => {
    call.answer(stream);
    const video = document.createElement('video');
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream);
    });
  });
});

function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener('loadedmetadata', () => video.play());
  videoGrid.append(video);
}

// Chat
const chatForm = document.getElementById('chat-form');
const chatBox = document.getElementById('chat-box');
chatForm.addEventListener('submit', e => {
  e.preventDefault();
  const message = e.target.elements.msg.value;
  socket.emit('chat-message', message);
  e.target.elements.msg.value = '';
});
socket.on('chat-message', msg => {
  const div = document.createElement('div');
  div.innerText = msg;
  chatBox.append(div);
});

// Whiteboard
const canvas = document.getElementById('whiteboard');
const ctx = canvas.getContext('2d');
let drawing = false;

canvas.addEventListener('mousedown', () => drawing = true);
canvas.addEventListener('mouseup', () => drawing = false);
canvas.addEventListener('mousemove', draw);

function draw(e) {
  if (!drawing) return;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#000';
  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(e.offsetX, e.offsetY);
  socket.emit('draw', { x: e.offsetX, y: e.offsetY });
}

socket.on('draw', data => {
  ctx.lineTo(data.x, data.y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(data.x, data.y);
});
