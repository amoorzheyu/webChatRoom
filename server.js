const express = require('express');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const app = express();
const port = 3000;

// 创建 HTTP 服务
const server = app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// 创建 WebSocket 服务器
const wss = new WebSocket.Server({ server });

let rooms = {}; // 用于存储房间信息，key 为房间密钥，value 为连接的客户端
wss.on('connection', (ws) => {
  console.log('A new user connected');
  
  let currentRoom = null; // 记录用户当前加入的房间
  let nickname = 'Guest'; // 默认昵称

  // 接收消息
  ws.on('message', (message) => {
    console.log('Received message: ', message);

    // 解析消息内容，前提是消息中包含房间信息
    let parsedMessage = JSON.parse(message);
    let room = parsedMessage.room;
    let content = parsedMessage.content;

    // 如果消息中包含昵称，则更新用户的昵称
    if (parsedMessage.nickname) {
      nickname = parsedMessage.nickname;
    }

    // 用户加入或切换房间
    if (currentRoom !== room) {
      // 退出当前房间
      if (currentRoom) {
        rooms[currentRoom] = rooms[currentRoom].filter(client => client !== ws);
      }

      // 加入新房间
      if (!rooms[room]) {
        rooms[room] = [];
      }
      rooms[room].push(ws);
      currentRoom = room;

      // 发送系统消息，通知房间其他用户
      const systemMessage = JSON.stringify({
        nickname: 'root',  // 系统消息的发送者是 'root'
        content: `${nickname} has joined the room.`
      });

      // 广播系统消息给当前房间的所有用户
      rooms[currentRoom].forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(systemMessage);
        }
      });

      console.log(`User joined room: ${room}`);
    }

    // 向当前房间的所有用户广播用户消息
    rooms[currentRoom].forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ nickname: nickname, content: content }));  // 广播昵称和消息内容
      }
    });
  });

  ws.on('close', () => {
    console.log('A user disconnected');
    // 离开房间时将用户从房间中移除
    if (currentRoom) {
      rooms[currentRoom] = rooms[currentRoom].filter(client => client !== ws);
    }
  });

  // 为 WebSocket 连接分配一个唯一的 userId
  ws.userId = 'user-' + Math.floor(Math.random() * 10000);
});


// 通过接口返回 index.html
app.get('/', (req, res) => {
  const filePath = path.join(__dirname, 'public', 'index.html');
  console.log('index.html path: ', filePath);

  fs.readFile(filePath, 'utf-8', (err, data) => {
    if (err) {
      console.error('Error reading index.html:', err);
      res.status(500).send('Error reading index.html');
    } else {
      res.send(data); // 返回 HTML 字符串
    }
  });
});

// 提供静态资源
app.use(express.static('public'));
