/**
 * 翻譯緩存模塊
 * 用於追蹤已翻譯的訊息，避免重複翻譯
 */

// 儲存已翻譯的訊息
// 結構: { 原訊息ID: { 語言代碼: 回覆訊息ID, ... }, ... }
const translatedMessages = new Map();

// 儲存待刪除的翻譯訊息，設置定時器
const deletionTimers = new Map();

/**
 * 檢查訊息是否已翻譯為特定語言
 * @param {string} messageId - 原始訊息ID
 * @param {string} langCode - 語言代碼
 * @returns {boolean} - 是否已翻譯
 */
function isTranslated(messageId, langCode) {
  const translations = translatedMessages.get(messageId);
  return translations ? !!translations[langCode] : false;
}

/**
 * 設置訊息已翻譯的標記
 * @param {string} messageId - 原始訊息ID
 * @param {string} langCode - 語言代碼
 * @param {string} replyId - 回覆訊息ID
 */
function setTranslated(messageId, langCode, replyId) {
  let translations = translatedMessages.get(messageId);
  
  if (!translations) {
    translations = {};
    translatedMessages.set(messageId, translations);
  }
  
  translations[langCode] = replyId;
}

/**
 * 移除訊息的翻譯標記
 * @param {string} messageId - 原始訊息ID
 * @param {string} langCode - 語言代碼，如果為null則移除所有語言
 */
function removeTranslated(messageId, langCode = null) {
  const translations = translatedMessages.get(messageId);
  
  if (!translations) {
    return;
  }
  
  if (langCode) {
    delete translations[langCode];
    
    // 如果沒有其他語言的翻譯，則移除整個訊息
    if (Object.keys(translations).length === 0) {
      translatedMessages.delete(messageId);
    }
  } else {
    // 移除所有語言的翻譯
    translatedMessages.delete(messageId);
  }
}

/**
 * 獲取已翻譯的回覆訊息ID
 * @param {string} messageId - 原始訊息ID
 * @param {string} langCode - 語言代碼
 * @returns {string|null} - 回覆訊息ID，如果不存在則返回null
 */
function getTranslatedReplyId(messageId, langCode) {
  const translations = translatedMessages.get(messageId);
  return translations ? translations[langCode] : null;
}

/**
 * 設置翻譯訊息的自動刪除計時器
 * @param {Object} client - Discord.js 客戶端
 * @param {string} messageId - 原始訊息ID
 * @param {string} replyId - 回覆訊息ID
 * @param {string} channelId - 頻道ID
 * @param {string} langCode - 語言代碼
 * @param {number} timeout - 刪除前的延遲時間（毫秒）
 */
function setDeletionTimer(client, messageId, replyId, channelId, langCode, timeout = 120000) {
  // 如果已有計時器，先清除
  if (deletionTimers.has(replyId)) {
    clearTimeout(deletionTimers.get(replyId));
  }
  
  // 創建新的刪除計時器
  const timer = setTimeout(async () => {
    try {
      // 獲取頻道
      const channel = await client.channels.fetch(channelId);
      
      if (channel) {
        // 嘗試獲取並刪除訊息
        try {
          const message = await channel.messages.fetch(replyId);
          if (message) {
            await message.delete();
          }
        } catch (err) {
          // 訊息可能已被刪除，或沒有權限刪除
          console.warn(`無法刪除訊息 ${replyId}:`, err.message);
        }
      }
      
      // 移除翻譯標記和計時器
      removeTranslated(messageId, langCode);
      deletionTimers.delete(replyId);
    } catch (error) {
      console.error('自動刪除翻譯訊息失敗:', error);
    }
  }, timeout);
  
  // 儲存計時器ID
  deletionTimers.set(replyId, timer);
}

/**
 * 取消訊息的自動刪除計時器
 * @param {string} replyId - 回覆訊息ID
 */
function cancelDeletionTimer(replyId) {
  if (deletionTimers.has(replyId)) {
    clearTimeout(deletionTimers.get(replyId));
    deletionTimers.delete(replyId);
  }
}

/**
 * 清除所有翻譯緩存和計時器
 */
function clearAllCache() {
  // 清除所有計時器
  deletionTimers.forEach(timer => clearTimeout(timer));
  
  // 清除緩存
  translatedMessages.clear();
  deletionTimers.clear();
}

module.exports = {
  isTranslated,
  setTranslated,
  removeTranslated,
  getTranslatedReplyId,
  setDeletionTimer,
  cancelDeletionTimer,
  clearAllCache
};