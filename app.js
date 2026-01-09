// app.js
App({
  onLaunch() {
    // 初始化云开发环境
    wx.cloud.init({
      env: 'default',
      traceUser: true
    });
    
    // 初始化本地存储
    if (!wx.getStorageSync('gameHistory')) {
      wx.setStorageSync('gameHistory', []);
    }
    if (!wx.getStorageSync('currentRoom')) {
      wx.setStorageSync('currentRoom', null);
    }
    
    // 默认获取微信用户信息
    this.getUserInfo();
  },
  getUserInfo() {
    wx.getUserProfile({
      desc: '用于显示用户头像和名称',
      success: (res) => {
        this.globalData.userInfo = res.userInfo;
      },
      fail: (err) => {
        console.error('获取用户信息失败', err);
        // 获取失败时不影响应用启动
      }
    });
  },
  globalData: {
    userInfo: null,
    currentRoom: null
  }
})