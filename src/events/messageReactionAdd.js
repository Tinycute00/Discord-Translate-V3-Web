const { Events } = require('discord.js');
const { translateText } = require('../utils/translate');
const { getTargetLanguage } = require('../utils/languageUtils');
const { isTranslationInProgress, setTranslationInProgress } = require('../utils/translationState');

module.exports = {
    name: Events.MessageReactionAdd,
    async execute(reaction, user) {
        // 如果是部分獲取的反應，需要獲取完整的反應數據
        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                console.error('獲取完整反應數據時發生錯誤:', error);
                return;
            }
        }

        // 忽略機器人的反應
        if (user.bot) return;

        // 獲取消息對象
        let message = reaction.message;
        if (message.partial) {
            try {
                message = await message.fetch();
            } catch (error) {
                console.error('獲取完整消息數據時發生錯誤:', error);
                return;
            }
        }

        // 檢查是否正在翻譯
        if (isTranslationInProgress(message.id)) {
            console.log(`消息 ${message.id} 正在翻譯中，跳過此次翻譯請求`);
            return;
        }

        // 設置翻譯狀態為進行中
        setTranslationInProgress(message.id, true);

        try {
            // 根據表情符號確定目標語言
            const targetLanguage = getTargetLanguage(reaction.emoji.name);
            if (!targetLanguage) {
                setTranslationInProgress(message.id, false);
                return;
            }

            // 獲取要翻譯的文本
            const textToTranslate = message.content;
            if (!textToTranslate) {
                setTranslationInProgress(message.id, false);
                return;
            }

            // 執行翻譯
            const translatedText = await translateText(textToTranslate, targetLanguage);
            if (!translatedText) {
                console.error('翻譯失敗');
                setTranslationInProgress(message.id, false);
                return;
            }

            // 回覆翻譯結果
            await message.reply({
                content: `翻譯結果:\n${translatedText}`,
                allowedMentions: { repliedUser: false }
            });

        } catch (error) {
            console.error('處理翻譯請求時發生錯誤:', error);
            try {
                await message.reply('抱歉，翻譯過程中發生錯誤。');
            } catch (replyError) {
                console.error('發送錯誤消息時發生錯誤:', replyError);
            }
        } finally {
            // 重置翻譯狀態
            setTranslationInProgress(message.id, false);
        }
    },
};