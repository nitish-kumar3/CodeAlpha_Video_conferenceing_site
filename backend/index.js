const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const { v4: uuidV4 } = require('uuid');
const path = require('path');

app.use(express.static(path.join(__dirname, '../frontend')));
app.get('/', (req, res) => {
  res.redirect(`/${uuidV4()}`);
});
app.get('/:room', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

io.on('connection', socket => {
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).broadcast.emit('user-connected', userId);

    socket.on('chat-message', msg => {
      socket.to(roomId).emit('chat-message', msg);
    });

    socket.on('draw', data => {
      socket.to(roomId).emit('draw', data);
    });
  });
});

server.listen(3000);
