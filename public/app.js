let socket; // 用于存储 WebSocket 实例
let isSocketOpen = false; // 用于标记 WebSocket 是否已经连接
const messages = document.getElementById("message_body");
const input = document.getElementById("input");
const roomInput = document.getElementById("room-input");
const nicknameInput = document.getElementById("nickname-input");
const joinButton = document.getElementById("join-button");
const leaveButton = document.getElementById("leave-button");
const chatContainer = document.getElementById("chat-container");
const enterContainer = document.getElementById("enter-container");
const sendButton = document.getElementById("send-button");

let userId = null; // 用户ID
let currentRoom = null; // 当前房间
let userNickname = null; // 用户昵称

// 页面加载时，自动填充房间号和昵称
window.onload = () => {
  userId = localStorage.getItem("userId");
  localStorage.getItem("currentRoom");
  localStorage.getItem("nickname") || "Guest"; // 默认昵称为 'Guest'

  // 如果没有身份，生成一个新的身份并存储
  if (!userId) {
    userId = "user-" + Math.floor(Math.random() * 10000);
    localStorage.setItem("userId", userId);
  }

  isSocketOpen = false;

  // 自动填充当前房间号和昵称
  if (currentRoom) {
    roomInput.value = currentRoom;
  }
  if (userNickname) {
    nicknameInput.value = userNickname;
  }

  // 如果已经有房间号和昵称，自动加入该房间
  // if (currentRoom && userNickname) {
  initializeWebSocket(); // 初始化WebSocket通过open回调进入聊天室
  // }
};

// 检查 WebSocket 是否已连接
function isWebSocketOpen() {
  return socket.readyState === WebSocket.OPEN;
}

// 初始化 WebSocket 连接
function initializeWebSocket() {
  if (socket && socket.readyState !== WebSocket.CLOSED) {
    socket.close(); // 如果现有连接未关闭，先关闭它
  }

  socket = new WebSocket("ws://localhost:3000");

  // WebSocket 事件处理函数
  socket.onopen = () => {
    isSocketOpen = true;
    joinButton.disabled = false; // 允许加入房间
    leaveButton.disabled = false; // 允许退出房间

    if (currentRoom && userNickname) {
        console.log("joinRoom111");
      joinRoom(currentRoom);
    }
  };

  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    const messageElement = document.createElement("div");
    messageElement.classList.add("terminal_promt");
    messageElement.innerHTML = `<span class="terminal_user">${message.nickname}</span>: <span class="terminal_message">${message.content}</span>`;
    messages.appendChild(messageElement);
    messages.scrollTop = messages.scrollHeight;
  };

  socket.onerror = (error) => {
    console.error("WebSocket 错误:", error);
    isSocketOpen = false;
  };

  socket.onclose = () => {
    isSocketOpen = false;
    joinButton.disabled = true; // 禁用加入按钮
    leaveButton.disabled = true; // 禁用退出按钮
  };
}

// 等待 WebSocket 连接成功后发送消息
function sendMessage() {
  const message = input.value;
  const room = roomInput.value; // 获取当前输入的房间密钥

  if (message && room && isWebSocketOpen()) {
    // 使用更新后的检查函数
    // 先手动将消息显示在当前用户的聊天窗口
    const messageElement = document.createElement("div");
    messageElement.classList.add("terminal_promt");
    messageElement.innerHTML = `<span class="terminal_user">${userNickname}</span>: <span class="terminal_message">${message}</span>`;
    messages.appendChild(messageElement);
    messages.scrollTop = messages.scrollHeight; // 自动滚动到最新消息

    const messageToSend = JSON.stringify({
      room,
      nickname: userNickname, // 确保发送正确的昵称
      content: message,
    }); // 包含昵称和房间信息
    socket.send(messageToSend);
    input.value = ""; // 清空输入框
  } else if (!isWebSocketOpen()) {
    console.log("WebSocket 连接尚未建立，请稍等片刻。");
  } else {
    console.log("请输入有效的房间密钥和消息内容。");
  }
}

// 用户加入房间
function joinRoom(room) {
  console.log("joinRoom");
  if (isWebSocketOpen()) {
    const messageToSend = JSON.stringify({
      room,
      nickname: userNickname, // 确保发送正确的昵称
      content: `I'm here.`,
    });
    socket.send(messageToSend);

    // 储存当前房间密钥
    localStorage.setItem("currentRoom", room);
    currentRoom = room;

    // 切换到聊天界面
    enterContainer.style.display = "none";
    chatContainer.style.display = "flex";

    // 隐藏加入按钮，显示退出按钮
    joinButton.style.display = "none";
    leaveButton.style.display = "block";
  } else {
    alert("WebSocket 连接尚未建立，请稍等片刻。");
  }
}

// 用户退出房间
function leaveRoom() {
  const messageToSend = JSON.stringify({
    room: currentRoom,
    nickname: userNickname, // 确保发送正确的昵称
    content: `${userNickname} has left the room.`,
  });

  console.log("test");
  socket.send(messageToSend);

  localStorage.removeItem("currentRoom");
  roomInput.value = ""; // 清空房间输入框

  // 切换回初始界面
  chatContainer.style.display = "none";
  enterContainer.style.display = "flex";

  // 显示进入按钮
  joinButton.style.display = "block";
  leaveButton.style.display = "none";

  // 关闭 WebSocket 连接
  socket.close();

  // 重新初始化 WebSocket 连接
  initializeWebSocket();
}

// 加入房间按钮点击事件
joinButton.addEventListener("click", () => {
  const room = roomInput.value.trim();
  const nickname = nicknameInput.value.trim();

  if (room && nickname) {
    // 储存昵称
    userNickname = nickname;
    localStorage.setItem("nickname", userNickname); // 储存昵称

    joinRoom(room); // 加入房间
  } else {
    alert("请输入房间密钥和昵称！");
  }
});

// 退出房间按钮点击事件
leaveButton.addEventListener("click", leaveRoom);

sendButton.addEventListener("click", sendMessage);



// 监听回车键发送消息
input.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault(); // 防止换行
    sendMessage(); // 回车发送消息
  }
});
