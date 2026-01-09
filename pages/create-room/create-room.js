//create-room.js
Page({
  data: {
    roomName: '麻将局',
    playerCountOptions: ['2人', '3人', '4人'],
    playerCountIndex: 2, // 默认4人
    initialScore: 1000
  },
  bindRoomNameInput(e) {
    this.setData({
      roomName: e.detail.value
    });
  },
  bindPlayerCountChange(e) {
    this.setData({
      playerCountIndex: e.detail.value
    });
  },
  bindInitialScoreInput(e) {
    this.setData({
      initialScore: e.detail.value
    });
  },
  createRoom() {
    const { roomName, playerCountIndex, initialScore } = this.data;
    const playerCount = parseInt(playerCountIndex) + 2;
    
    // 生成房间ID（时间戳+随机数，确保唯一性）
    const timestamp = Date.now().toString().slice(-6);
    const randomPart = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const roomId = `${timestamp}${randomPart}`;
    
    // 获取app实例和用户信息
    const app = getApp();
    const userInfo = app.globalData.userInfo;
    
    // 创建房间信息
    const room = {
      _id: roomId,
      id: roomId,
      name: roomName,
      playerCount: playerCount,
      initialScore: parseInt(initialScore),
      players: [],
      history: [],
      createdAt: new Date().toISOString(),
      creator: userInfo ? userInfo.nickName : '当前用户',
      creatorAvatar: userInfo ? userInfo.avatarUrl : ''
    };
    
    // 初始化玩家
    for (let i = 1; i <= playerCount; i++) {
      room.players.push({
        id: i,
        name: `玩家${i}`,
        score: parseInt(initialScore)
      });
    }
    
    // 保存到云数据库
    const db = wx.cloud.database();
    db.collection('majiang_rooms').add({
      data: room,
      success: (res) => {
        console.log('房间创建成功', res);
        // 保存房间信息到本地存储
        wx.setStorageSync('currentRoom', room);
        
        // 跳转到房间页面
        wx.navigateTo({
          url: `/pages/room/room?roomId=${roomId}`
        });
      },
      fail: (err) => {
        console.error('房间创建失败', err);
        wx.showToast({
          title: '房间创建失败',
          icon: 'none'
        });
        // 即使云数据库失败，也保存到本地并跳转
        wx.setStorageSync('currentRoom', room);
        wx.navigateTo({
          url: `/pages/room/room?roomId=${roomId}`
        });
      }
    });
  }
})