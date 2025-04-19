const { Events } = require('discord.js');
const { translateText } = require('../utils/translate');
const { getTargetLanguage } = require('../utils/languageUtils');
const { isTranslationInProgress, setTranslationInProgress } = require('../utils/translationState');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        // 忽略機器人消息
        if (message.author.bot) return;

        // 檢查是否是回覆消息
        if (!message.reference) return;

        try {
            // 獲取被回覆的消息
            const repliedMessage = await message.channel.messages.fetch(message.reference.messageId);
            
            // 檢查被回覆的消息是否存在且不是機器人的消息
            if (!repliedMessage || repliedMessage.author.bot) return;

            // 檢查是否包含翻譯命令前綴
            const translatePrefix = '!translate';
            if (!message.content.toLowerCase().startsWith(translatePrefix)) return;

            // 檢查是否正在翻譯
            if (isTranslationInProgress(repliedMessage.id)) {
                console.log(`消息 ${repliedMessage.id} 正在翻譯中，跳過此次翻譯請求`);
                return;
            }

            // 設置翻譯狀態為進行中
            setTranslationInProgress(repliedMessage.id, true);

            try {
                // 解析目標語言
                const args = message.content.slice(translatePrefix.length).trim().split(/ +/);
                const targetLanguage = args[0] || 'en'; // 默認翻譯為英語

                // 獲取要翻譯的文本
                const textToTranslate = repliedMessage.content;
                if (!textToTranslate) {
                    await message.reply('無法獲取要翻譯的文本。');
                    return;
                }

                // 執行翻譯
                const translatedText = await translateText(textToTranslate, targetLanguage);
                if (!translatedText) {
                    await message.reply('翻譯失敗。');
                    return;
                }

                // 回覆翻譯結果
                await message.reply({
                    content: `翻譯結果:\n${translatedText}`,
                    allowedMentions: { repliedUser: false }
                });

            } catch (error) {
                console.error('處理翻譯請求時發生錯誤:', error);
                await message.reply('抱歉，翻譯過程中發生錯誤。');
            } finally {
                // 重置翻譯狀態
                setTranslationInProgress(repliedMessage.id, false);
            }

        } catch (error) {
            console.error('處理消息時發生錯誤:', error);
        }
    },
};