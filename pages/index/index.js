//index.js
Page({
  data: {
    roomId: '',
    userInfo: null
  },
  onLoad(options) {
    // 处理分享卡片打开
    if (options.roomId && options.invite) {
      const roomId = options.roomId;
      this.setData({ roomId });
      // 自动跳转到房间页面
      this.joinRoom();
    }
    
    // 获取app实例和用户信息
    const app = getApp();
    this.setData({ userInfo: app.globalData.userInfo });
  },
  onShow() {
    // 每次页面显示时更新用户信息
    const app = getApp();
    this.setData({ userInfo: app.globalData.userInfo });
  },
  bindRoomIdInput(e) {
    this.setData({
      roomId: e.detail.value
    });
  },
  getUserInfo() {
    const app = getApp();
    wx.getUserProfile({
      desc: '用于显示用户头像和名称',
      success: (res) => {
        app.globalData.userInfo = res.userInfo;
        this.setData({ userInfo: res.userInfo });
        wx.showToast({
          title: '获取用户信息成功',
          icon: 'success'
        });
      },
      fail: (err) => {
        console.error('获取用户信息失败', err);
        wx.showToast({
          title: '获取用户信息失败',
          icon: 'none'
        });
      }
    });
  },
  joinRoom() {
    const { roomId } = this.data;
    if (!roomId) {
      wx.showToast({
        title: '请输入房间号',
        icon: 'none'
      });
      return;
    }
    // 模拟加入房间逻辑
    wx.showToast({
      title: '加入房间成功',
      icon: 'success'
    });
    // 跳转到房间页面
    wx.navigateTo({
      url: `/pages/room/room?roomId=${roomId}&type=multi`
    });
  }
})