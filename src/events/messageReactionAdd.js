/**
 * 訊息添加表情符號的事件處理器 (身分組版本)
 * Message reaction add event handler (Role-based version)
 * 負責偵測伺服器設定的觸發表情符號，並根據使用者身分組觸發翻譯功能
 * Responsible for detecting the server's trigger emoji and triggering translation based on user roles
 */
const { getTriggerEmoji, getLanguagesForRoles } = require('../database/languageSettings'); // Updated imports
const { translate, detectLanguage } = require('../utils/translator');
const { isTranslated, setTranslated, setDeletionTimer } = require('../utils/translationCache');
const { isChannelListening } = require('../database/channelSettings');

// 用於追蹤正在處理中的翻譯請求 (Key: messageId:targetLangCode)
// For tracking translation requests that are being processed (Key: messageId:targetLangCode)
const processingTranslations = new Map();

// 延遲函數
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 處理單一語言的翻譯邏輯
 * Handles the translation logic for a single language
 * @param {Message} message - The original message object
 * @param {string} targetLangCode - The target language code
 * @param {string} sourceLangCode - The detected source language code
 * @param {Client} client - The Discord client instance
 * @param {string} guildId - The ID of the guild
 */
async function handleSingleTranslation(message, targetLangCode, sourceLangCode, client, guildId) {
    const requestId = `${message.id}:${targetLangCode}`;

    // 檢查是否已經翻譯過或正在處理中
    if (isTranslated(message.id, targetLangCode)) {
        console.log(`[${guildId}] 跳過 ${targetLangCode}: 已翻譯 / Skipping ${targetLangCode}: Already translated`);
        return;
    }
    if (processingTranslations.has(requestId)) {
        console.log(`[${guildId}] 跳過 ${targetLangCode}: 正在處理中 / Skipping ${targetLangCode}: Already processing`);
        // Optional: Add more sophisticated check like in the original code if needed
        return;
    }

    // 標記為正在處理
    processingTranslations.set(requestId, Date.now());

    try {
        // 檢查源語言和目標語言是否相同或特殊情況
        const isSourceChinese = sourceLangCode === 'zh-CN' || sourceLangCode === 'zh-TW' || sourceLangCode === 'zh';
        const isTargetChinese = targetLangCode === 'zh-CN' || targetLangCode === 'zh-TW' || targetLangCode === 'zh';
        const isBothChinese = isSourceChinese && isTargetChinese;
        const isChineseLaughter = /^[哈呵嘻嘿啊]{2,}$/.test(message.content.trim());

        if (sourceLangCode === targetLangCode || isBothChinese || (isChineseLaughter && targetLangCode === 'en')) {
            console.log(`[${guildId}] 跳過 ${targetLangCode}: 相同語言或特殊文本 / Skipping ${targetLangCode}: Same language or special text`);
            setTranslated(message.id, targetLangCode, "same_language");
            processingTranslations.delete(requestId);
            return;
        }

        // 執行翻譯
        console.log(`[${guildId}] 正在翻譯 ${sourceLangCode} -> ${targetLangCode} / Translating ${sourceLangCode} -> ${targetLangCode}`);
        const translatedText = await translate(message.content, targetLangCode, sourceLangCode);

        // 發送翻譯結果作為回覆
        const reply = await message.reply(translatedText).catch(err => {
            console.error(`[${guildId}] 回覆訊息失敗 (${targetLangCode}):`, err);
            // Attempt to notify in channel if reply fails? Maybe too noisy.
            return null; // Indicate failure
        });

        if (reply) {
            // 記錄翻譯狀態
            setTranslated(message.id, targetLangCode, reply.id);
            // 設置定時刪除 (2分鐘後)
            setDeletionTimer(client, message.id, reply.id, message.channel.id, targetLangCode, 120000);
             console.log(`[${guildId}] 成功翻譯並回覆 ${targetLangCode} / Successfully translated and replied ${targetLangCode}`);
        } else {
             console.log(`[${guildId}] 未能回覆翻譯 ${targetLangCode} / Failed to reply with translation ${targetLangCode}`);
             // Should we mark as translated even if reply failed? Maybe not, allow retry?
             // For now, we don't mark as translated if reply fails.
        }

    } catch (error) {
        console.error(`[${guildId}] 翻譯 ${targetLangCode} 失敗:`, error);
        // Handle specific translation errors if needed (e.g., API errors)
        // Optionally reply with an error message for this specific language
        // const errorReply = await message.reply(...); // Be careful about rate limits
    } finally {
        // 從處理中列表移除
        processingTranslations.delete(requestId);
    }
}


module.exports = {
  name: 'messageReactionAdd',
  async execute(reaction, user, client) {
    // 忽略機器人自己的反應
    if (user.bot) return;

    // 獲取伺服器 ID
    const guildId = reaction.message.guild?.id;
    if (!guildId) return; // 只在伺服器中運作

    // 獲取觸發表情符號
    const triggerEmoji = getTriggerEmoji(guildId);
    const reactedEmoji = reaction.emoji.name;

    // 檢查是否為設定的觸發表情符號
    if (reactedEmoji !== triggerEmoji) {
        // console.log(`[${guildId}] 忽略反應: ${reactedEmoji} (非觸發符 ${triggerEmoji})`);
        return;
    }
     console.log(`[${guildId}] 偵測到觸發反應: ${reactedEmoji}`);

    // 如果是部分訊息，則獲取完整的訊息
    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch (error) {
        console.error(`[${guildId}] 獲取完整反應失敗:`, error);
        return;
      }
    }
    let message = reaction.message;
    if (message.partial) {
      try {
        message = await message.fetch();
      } catch (error) {
        console.error(`[${guildId}] 獲取完整訊息失敗:`, error);
        return;
      }
    }

     // 檢查頻道是否在監聽列表中
     const channelId = message.channel.id;
     if (!isChannelListening(channelId, guildId)) {
       console.log(`[${guildId}] 忽略反應: 頻道 ${channelId} 未監聽`);
       return;
     }

    // 檢查訊息是否有內容需要翻譯
    if (!message.content || message.content.trim() === '') {
        console.log(`[${guildId}] 忽略反應: 訊息無內容`);
        return;
    }

    // 獲取觸發反應的使用者成員對象和身分組
    const member = reaction.message.guild.members.cache.get(user.id) || await reaction.message.guild.members.fetch(user.id).catch(() => null);
    if (!member) {
        console.log(`[${guildId}] 忽略反應: 無法獲取成員 ${user.id}`);
        return; // Cannot get roles if member is not available
    }
    const userRoleIds = member.roles.cache.map(role => role.id);

    // 獲取使用者可翻譯的語言列表
    const targetLangCodes = getLanguagesForRoles(guildId, userRoleIds);

    if (targetLangCodes.length === 0) {
        console.log(`[${guildId}] 忽略反應: 使用者 ${user.tag} (${user.id}) 沒有對應的翻譯語言`);
        // 可選：回覆一個臨時訊息告知使用者沒有權限？
        // await reaction.users.remove(user.id).catch(console.error); // Remove reaction?
        // await message.reply({ content: '您目前的身分組沒有設定可翻譯的語言。', ephemeral: true }); // Might be too noisy
        return;
    }

     console.log(`[${guildId}] 使用者 ${user.tag} 的目標語言: ${targetLangCodes.join(', ')}`);

    // 檢測原始訊息語言 (只需要檢測一次)
    let sourceLangCode;
    try {
        sourceLangCode = await detectLanguage(message.content);
         console.log(`[${guildId}] 原始訊息語言: ${sourceLangCode}`);
    } catch (error) {
        console.error(`[${guildId}] 檢測語言失敗:`, error);
        return; // Cannot proceed without source language
    }

    // 遍歷目標語言並處理翻譯
    for (const targetLangCode of targetLangCodes) {
        // 使用輔助函數處理每個語言的翻譯
        // We don't await here, let translations run in parallel
        handleSingleTranslation(message, targetLangCode, sourceLangCode, client, guildId);
        // Add a small delay between starting each translation to potentially avoid rate limits
        await delay(100); // 100ms delay between each language translation start
    }
  }
};