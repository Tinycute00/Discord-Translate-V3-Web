/**
 * 消息創建事件處理器
 * 自動在每則新消息下添加預設表情符號，方便用戶點擊觸發翻譯
 */
const { EmbedBuilder } = require('discord.js');
const { isChannelListening } = require('../database/channelSettings'); // 引入 isChannelListening
const { getTriggerEmoji } = require('../database/languageSettings'); // 引入 getTriggerEmoji

module.exports = {
  name: 'messageCreate',
  on: true,
  async execute(message, client) {
    try {
      // 忽略機器人消息 / Ignore bot messages
      if (message.author.bot) return;
      
      // 忽略DM消息 / Ignore DM messages
      if (!message.guild) return;
      
      // 檢查消息是否有實際內容 / Check if message has actual content
      if (!message.content || message.content.trim() === '') {
        return; // 沒有文本內容，忽略 / No text content, ignore
      }

      // 檢查頻道是否在監聽列表中 / Check if the channel is in the listening list
      if (!isChannelListening(message.channel.id, message.guild.id)) {
        // console.log(`頻道 ${message.channel.name} (${message.channel.id}) 不在監聽列表中，忽略訊息。`); // 可選的調試日誌
        return; // 如果頻道不在監聽列表（且列表不為空），則忽略 / If the channel is not in the listening list (and the list is not empty), ignore
      }

      // 獲取伺服器的觸發表情符號 / Get the server's trigger emoji
      const triggerEmoji = getTriggerEmoji(message.guild.id);

      // 如果無法獲取觸發表情符號（雖然 getTriggerEmoji 會返回預設值，但以防萬一）
      // If trigger emoji cannot be obtained (although getTriggerEmoji returns a default, just in case)
      if (!triggerEmoji) {
          console.error(`無法獲取伺服器 ${message.guild.id} 的觸發表情符號。`);
          return;
      }

      // 等待小延遲以避免可能的速率限制 / Small delay to avoid potential rate limits
      await new Promise(resolve => setTimeout(resolve, 200)); // Reduced delay slightly

      // 嘗試添加觸發表情符號 / Try to add the trigger emoji
      try {
        // 嘗試提取自訂表情符號的 ID / Try to extract the ID of the custom emoji
        const customEmojiMatch = triggerEmoji.match(/<a?:.+:(\d+)>/);
        const reactionTarget = customEmojiMatch ? customEmojiMatch[1] : triggerEmoji;

        await message.react(reactionTarget);
        // console.log(`已為訊息 ${message.id} 添加觸發表情符號 ${triggerEmoji}`); // 可選的調試日誌
      } catch (error) {
        if (error.message.includes('Unknown Emoji')) {
          // 如果是未知表情符號錯誤，記錄警告並跳過 / If it's an Unknown Emoji error, log a warning and skip
          console.warn(`[警告] 無法為伺服器 "${message.guild.name}" (ID: ${message.guild.id}) 中的訊息 ${message.id} 添加觸發表情符號 ${triggerEmoji}。該表情符號可能已被刪除、來自機器人未加入的伺服器或無法存取。`);
        } else {
          // 對於其他錯誤，記錄錯誤訊息 / For other errors, log the error message
          console.error(`為訊息 ${message.id} 添加觸發表情符號 ${triggerEmoji} 時出錯:`, error.message);
          // 可能的錯誤：缺少權限 (Missing Permissions) / Possible errors: Missing Permissions
        }
      }
      
    } catch (error) {
      console.error('處理新消息時出錯:', error);
    }
  }
};