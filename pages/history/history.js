//history.js
Page({
  data: {
    gameHistory: []
  },
  onLoad() {
    this.loadHistory();
  },
  onShow() {
    this.loadHistory();
  },
  loadHistory() {
    let gameHistory = wx.getStorageSync('gameHistory') || [];
    // 格式化时间
    gameHistory = gameHistory.map(item => {
      const date = new Date(item.settleTime);
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return {
        ...item,
        formattedTime: `${year}-${month}-${day} ${hours}:${minutes}`
      };
    });
    // 按时间倒序排列
    gameHistory.sort((a, b) => new Date(b.settleTime) - new Date(a.settleTime));
    this.setData({
      gameHistory: gameHistory
    });
  },
  viewDetail(e) {
    const gameId = e.currentTarget.dataset.id;
    const gameHistory = this.data.gameHistory;
    const game = gameHistory.find(g => g.id === gameId);
    
    if (game) {
      // 跳转到结算页面查看详情
      wx.navigateTo({
        url: `/pages/result/result?result=${JSON.stringify(game.players)}`
      });
    }
  }
})