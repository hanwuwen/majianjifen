//room.js
Page({
  data: {
    room: null,
    players: [],
    playerNames: [],
    selectedPlayer: null,
    score: '',
    history: [],
    roomId: '',
    watcher: null,
    autoFocus: false,
    syncStatus: 'idle', // idle, loading, syncing, synced
    userInfo: null
  },
  onLoad(options) {
    const { roomId, type } = options;
    this.setData({ roomId });
    
    // 获取app实例和用户信息
    const app = getApp();
    this.setData({ userInfo: app.globalData.userInfo });
    
    if (type === 'single') {
      // 单人模式
      const player = {
        id: 1,
        name: app.globalData.userInfo ? app.globalData.userInfo.nickName : '玩家1',
        score: 1000
      };
      this.setData({
        players: [player],
        playerNames: [player.name],
        selectedPlayer: player,
        history: []
      });
    } else if (roomId) {
      // 多人模式，从云数据库加载房间信息
      this.loadRoomFromCloud(roomId);
      // 开启分享功能
      wx.showShareMenu({
        withShareTicket: true,
        menus: ['shareAppMessage', 'shareTimeline']
      });
    }
  },
  onShow() {
    // 每次页面显示时更新用户信息
    const app = getApp();
    this.setData({ userInfo: app.globalData.userInfo });
  },
  loadRoomFromCloud(roomId) {
    this.setData({ syncStatus: 'loading' });
    const db = wx.cloud.database();
    db.collection('majiang_rooms').doc(roomId).get({
      success: (res) => {
        if (res.data) {
          const room = res.data;
          const userInfo = this.data.userInfo;
          
          // 为玩家添加头像信息
          const playersWithAvatar = room.players.map(player => {
            // 如果玩家是当前用户，使用当前用户的头像
            if (player.name === userInfo?.nickName) {
              return { ...player, avatar: userInfo.avatarUrl };
            }
            return player;
          });
          
          this.setData({
            room: room,
            players: playersWithAvatar,
            playerNames: playersWithAvatar.map(p => p.name),
            selectedPlayer: playersWithAvatar[0],
            history: room.history || [],
            syncStatus: 'synced'
          });
          // 保存到本地存储
          wx.setStorageSync('currentRoom', {
            ...room,
            players: playersWithAvatar
          });
          // 开始监听数据变化
          this.startWatchingRoom(roomId);
        } else {
          // 从本地存储加载
          const room = wx.getStorageSync('currentRoom');
          if (room) {
            const userInfo = this.data.userInfo;
            
            // 为玩家添加头像信息
            const playersWithAvatar = room.players.map(player => {
              if (player.name === userInfo?.nickName) {
                return { ...player, avatar: userInfo.avatarUrl };
              }
              return player;
            });
            
            this.setData({
              room: room,
              players: playersWithAvatar,
              playerNames: playersWithAvatar.map(p => p.name),
              selectedPlayer: playersWithAvatar[0],
              history: room.history,
              syncStatus: 'synced'
            });
          } else {
            this.setData({ syncStatus: 'idle' });
          }
        }
      },
      fail: (err) => {
        console.error('加载房间失败', err);
        // 从本地存储加载
        const room = wx.getStorageSync('currentRoom');
        if (room) {
          this.setData({
            room: room,
            players: room.players,
            playerNames: room.players.map(p => p.name),
            selectedPlayer: room.players[0],
            history: room.history,
            syncStatus: 'synced'
          });
        } else {
          this.setData({ syncStatus: 'idle' });
        }
      }
    });
  },
  startWatchingRoom(roomId) {
    const db = wx.cloud.database();
    // 监听房间数据变化
    this.setData({
      watcher: db.collection('majiang_rooms').doc(roomId).watch({
        onChange: (snapshot) => {
          if (snapshot.docChanges.length > 0) {
            this.setData({ syncStatus: 'syncing' });
            const room = snapshot.docChanges[0].doc;
            const userInfo = this.data.userInfo;
            
            // 为玩家添加头像信息
            const playersWithAvatar = room.players.map(player => {
              if (player.name === userInfo?.nickName) {
                return { ...player, avatar: userInfo.avatarUrl };
              }
              return player;
            });
            
            this.setData({
              room: room,
              players: playersWithAvatar,
              playerNames: playersWithAvatar.map(p => p.name),
              history: room.history || [],
              syncStatus: 'synced'
            });
            // 更新本地存储
            wx.setStorageSync('currentRoom', {
              ...room,
              players: playersWithAvatar
            });
            
            // 检查房间是否已被结算
            if (room.status === 'settled' && room.settledPlayers) {
              // 为结算玩家添加头像信息
              const settledPlayersWithAvatar = room.settledPlayers.map(player => {
                if (player.name === userInfo?.nickName) {
                  return { ...player, avatar: userInfo.avatarUrl };
                }
                return player;
              });
              
              // 显示结算提示
              wx.showModal({
                title: '本局已结算',
                content: '房主已结算本局游戏，是否查看结算结果？',
                success: (res) => {
                  if (res.confirm) {
                    // 跳转到结算页面
                    wx.navigateTo({
                      url: `/pages/result/result?result=${JSON.stringify(settledPlayersWithAvatar)}`
                    });
                  }
                }
              });
            }
          }
        },
        onError: (err) => {
          console.error('监听房间失败', err);
          this.setData({ syncStatus: 'idle' });
        }
      })
    });
  },
  onUnload() {
    // 停止监听
    if (this.data.watcher) {
      this.data.watcher.close();
    }
  },
  selectPlayer(e) {
    const playerId = e.currentTarget.dataset.id;
    const player = this.data.players.find(p => p.id === playerId);
    this.setData({
      selectedPlayer: player,
      autoFocus: true
    });
    // 延迟关闭自动聚焦，避免影响用户操作
    setTimeout(() => {
      this.setData({ autoFocus: false });
    }, 500);
  },
  setQuickScore(e) {
    const score = e.currentTarget.dataset.score;
    this.setData({ score });
  },
  inviteFriends() {
    // 显示分享菜单
    wx.updateShareMenu({
      withShareTicket: true
    });
    // 触发分享
    wx.showToast({
      title: '请选择要邀请的好友',
      icon: 'none'
    });
  },
  onShareAppMessage() {
    const room = this.data.room;
    if (room) {
      return {
        title: `邀请你加入${room.name}`,
        path: `/pages/index/index?roomId=${room.id}&invite=true`,
        imageUrl: '/assets/majiangjifen_.png',
        desc: `房间号: ${room.id}，快来一起打麻将吧！`
      };
    }
    return {
      title: '麻将计分',
      path: '/pages/index/index',
      imageUrl: '/assets/majiangjifen_.png',
      desc: '快来一起打麻将计分吧！'
    };
  },
  onShareTimeline() {
    const room = this.data.room;
    if (room) {
      return {
        title: `邀请你加入${room.name}`,
        path: `/pages/index/index?roomId=${room.id}&invite=true`,
        imageUrl: '/assets/majiangjifen_.png',
        query: `roomId=${room.id}&invite=true`
      };
    }
    return {
      title: '麻将计分',
      path: '/pages/index/index',
      imageUrl: '/assets/majiangjifen_.png',
      query: ''
    };
  },
  editPlayerName(e) {
    const playerId = e.currentTarget.dataset.id;
    const players = this.data.players;
    const player = players.find(p => p.id === playerId);
    
    wx.showModal({
      title: '编辑姓名',
      content: '请输入新的玩家姓名',
      inputValue: player.name,
      success: (res) => {
        if (res.confirm && res.inputValue) {
          player.name = res.inputValue;
          this.setData({
            players: players,
            playerNames: players.map(p => p.name),
            selectedPlayer: this.data.selectedPlayer.id === playerId ? player : this.data.selectedPlayer
          });
          
          // 保存到本地存储和云数据库
          if (this.data.room) {
            const room = this.data.room;
            room.players = players;
            wx.setStorageSync('currentRoom', room);
            // 更新云数据库
            const db = wx.cloud.database();
            db.collection('majiang_rooms').doc(this.data.roomId).update({
              data: {
                players: players
              }
            });
          }
        }
      }
    });
  },
  bindScoreInput(e) {
    // 只允许输入数字
    const value = e.detail.value.replace(/[^0-9]/g, '');
    this.setData({
      score: value
    });
  },
  addScore() {
    this.updateScore('add');
  },
  subtractScore() {
    this.updateScore('subtract');
  },
  updateScore(type) {
    const score = parseInt(this.data.score);
    const selectedPlayer = this.data.selectedPlayer;
    
    if (!selectedPlayer) {
      wx.showToast({
        title: '请选择玩家',
        icon: 'none'
      });
      return;
    }
    
    if (isNaN(score) || score <= 0) {
      wx.showToast({
        title: '请输入有效的得分',
        icon: 'none'
      });
      return;
    }
    
    const players = this.data.players;
    const playerIndex = players.findIndex(p => p.id === selectedPlayer.id);
    
    // 记录操作前的总分
    const initialTotal = players.reduce((sum, p) => sum + p.score, 0);
    
    // 处理得分逻辑
    if (type === 'add') {
      // 加分：从其他玩家那里减去相应分数
      players[playerIndex].score += score;
      
      // 计算每个其他玩家需要减去的分数
      const otherPlayers = players.filter(p => p.id !== selectedPlayer.id);
      if (otherPlayers.length > 0) {
        const subtractPerPlayer = Math.floor(score / otherPlayers.length);
        const remainder = score % otherPlayers.length;
        
        // 分配减去的分数
        otherPlayers.forEach((player, index) => {
          const playerIdx = players.findIndex(p => p.id === player.id);
          players[playerIdx].score -= subtractPerPlayer;
          // 处理余数
          if (index < remainder) {
            players[playerIdx].score -= 1;
          }
        });
      }
    } else {
      // 减分：将分数分配给其他玩家
      players[playerIndex].score -= score;
      
      // 计算每个其他玩家可以获得的分数
      const otherPlayers = players.filter(p => p.id !== selectedPlayer.id);
      if (otherPlayers.length > 0) {
        const addPerPlayer = Math.floor(score / otherPlayers.length);
        const remainder = score % otherPlayers.length;
        
        // 分配增加的分数
        otherPlayers.forEach((player, index) => {
          const playerIdx = players.findIndex(p => p.id === player.id);
          players[playerIdx].score += addPerPlayer;
          // 处理余数
          if (index < remainder) {
            players[playerIdx].score += 1;
          }
        });
      }
    }
    
    // 检查总分是否保持平衡
    const finalTotal = players.reduce((sum, p) => sum + p.score, 0);
    if (finalTotal !== initialTotal) {
      wx.showToast({
        title: '分数计算错误，请重新输入',
        icon: 'none'
      });
      return;
    }
    
    // 记录历史
    const history = this.data.history;
    const mainHistoryRecord = {
      id: Date.now(),
      playerId: selectedPlayer.id,
      playerName: selectedPlayer.name,
      score: score,
      type: type,
      time: new Date().toISOString()
    };
    history.push(mainHistoryRecord);
    
    // 记录其他玩家的分数变化历史
    const otherPlayers = players.filter(p => p.id !== selectedPlayer.id);
    otherPlayers.forEach((player, index) => {
      const playerIdx = players.findIndex(p => p.id === player.id);
      const originalScore = this.data.players[playerIdx].score;
      const newScore = players[playerIdx].score;
      const scoreChange = newScore - originalScore;
      
      if (scoreChange !== 0) {
        const otherHistoryRecord = {
          id: Date.now() + index,
          playerId: player.id,
          playerName: player.name,
          score: Math.abs(scoreChange),
          type: scoreChange > 0 ? 'add' : 'subtract',
          time: new Date().toISOString(),
          relatedTo: selectedPlayer.id
        };
        history.push(otherHistoryRecord);
      }
    });
    
    this.setData({
      players: players,
      history: history
    });
    
    // 保存到本地存储和云数据库
    if (this.data.room) {
      const room = this.data.room;
      room.players = players;
      room.history = history;
      wx.setStorageSync('currentRoom', room);
      // 更新云数据库
      this.setData({ syncStatus: 'syncing' });
      const db = wx.cloud.database();
      db.collection('majiang_rooms').doc(this.data.roomId).update({
        data: {
          players: players,
          history: history
        },
        success: () => {
          this.setData({ syncStatus: 'synced' });
        },
        fail: (err) => {
          console.error('更新房间失败', err);
          this.setData({ syncStatus: 'idle' });
        }
      });
    }
    
    // 显示成功提示
    wx.showToast({
      title: `已为${selectedPlayer.name}${type === 'add' ? '赢' : '输'}${score}分`,
      icon: 'success'
    });
  },
  settle() {
    const players = this.data.players;
    const room = this.data.room;
    const userInfo = this.data.userInfo;
    
    // 多人模式下检查是否为房主
    if (room && room.creator) {
      // 检查当前用户是否是房主
      if (userInfo && userInfo.nickName !== room.creator) {
        wx.showToast({
          title: '只有房主才能结算对局',
          icon: 'none'
        });
        return;
      }
      
      // 显示结算确认提示
      this.showSettlementConfirm(players, room);
    } else {
      // 单人模式或没有房主信息的情况，直接显示确认提示
      this.showSettlementConfirm(players, room);
    }
  },
  
  showSettlementConfirm(players, room) {
    // 显示结算确认提示
    wx.showModal({
      title: '结算确认',
      content: '确定要结算本局游戏吗？结算后将无法继续计分。',
      success: (res) => {
        if (res.confirm) {
          // 保存到历史记录
          const historyRecord = {
            id: Date.now(),
            roomName: room ? room.name : '单人游戏',
            roomId: room ? room.id : null,
            players: players,
            history: this.data.history,
            settleTime: new Date().toISOString()
          };
          
          const gameHistory = wx.getStorageSync('gameHistory') || [];
          gameHistory.push(historyRecord);
          wx.setStorageSync('gameHistory', gameHistory);
          
          // 如果是多人模式，更新云数据库中的房间状态为已结算
          if (room && room.id) {
            const db = wx.cloud.database();
            db.collection('majiang_rooms').doc(room.id).update({
              data: {
                status: 'settled',
                settledPlayers: players,
                settleTime: new Date().toISOString()
              },
              success: (res) => {
                console.log('房间状态更新成功', res);
              },
              fail: (err) => {
                console.error('房间状态更新失败', err);
              }
            });
          }
          
          // 跳转到结算页面
          wx.navigateTo({
            url: `/pages/result/result?result=${JSON.stringify(players)}`
          });
        }
      }
    });
  }
})