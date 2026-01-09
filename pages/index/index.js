//index.js
Page({
  data: {
    roomId: ''
  },
  onLoad(options) {
    // 处理分享卡片打开
    if (options.roomId && options.invite) {
      const roomId = options.roomId;
      this.setData({
        roomId: roomId
      });
      // 自动跳转到房间页面
      this.joinRoom();
    }
  },
  bindRoomIdInput(e) {
    this.setData({
      roomId: e.detail.value
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