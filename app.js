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
  },
  globalData: {
    userInfo: null,
    currentRoom: null
  }
})