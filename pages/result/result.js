//result.js
Page({
  data: {
    result: [],
    maxScore: 0,
    minScore: 0,
    avgScore: 0
  },
  onLoad(options) {
    if (options.result) {
      const result = JSON.parse(options.result);
      this.setData({
        result: result
      });
      
      // 计算汇总信息
      this.calculateSummary(result);
    }
  },
  calculateSummary(players) {
    if (players.length === 0) return;
    
    const scores = players.map(p => p.score);
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    const avgScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
    
    this.setData({
      maxScore: maxScore,
      minScore: minScore,
      avgScore: avgScore
    });
  },
  backToHome() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  },
  viewHistory() {
    wx.switchTab({
      url: '/pages/history/history'
    });
  }
})