const { Events } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // 處理斜線命令
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`找不到命令 ${interaction.commandName}`);
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(`執行命令 ${interaction.commandName} 時發生錯誤:`, error);
                
                // 如果交互還未回覆，發送錯誤消息
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content: '執行此命令時發生錯誤！',
                        ephemeral: true
                    });
                } else {
                    // 如果已經回覆或延遲回覆，發送後續消息
                    await interaction.followUp({
                        content: '執行此命令時發生錯誤！',
                        ephemeral: true
                    });
                }
            }
        }
        // 處理按鈕交互
        else if (interaction.isButton()) {
            // 獲取按鈕的自定義ID
            const buttonId = interaction.customId;
            
            try {
                // 根據按鈕ID執行相應的處理邏輯
                switch (buttonId) {
                    case 'translate_button':
                        // 處理翻譯按鈕點擊
                        await handleTranslateButton(interaction);
                        break;
                    // 可以添加更多按鈕處理邏輯
                    default:
                        console.warn(`未知的按鈕ID: ${buttonId}`);
                        await interaction.reply({
                            content: '無法處理此按鈕操作。',
                            ephemeral: true
                        });
                }
            } catch (error) {
                console.error('處理按鈕交互時發生錯誤:', error);
                await interaction.reply({
                    content: '處理您的請求時發生錯誤。',
                    ephemeral: true
                });
            }
        }
        // 處理選擇菜單交互
        else if (interaction.isStringSelectMenu()) {
            // 獲取選擇菜單的自定義ID
            const menuId = interaction.customId;
            
            try {
                // 根據選擇菜單ID執行相應的處理邏輯
                switch (menuId) {
                    case 'language_select':
                        // 處理語言選擇
                        await handleLanguageSelect(interaction);
                        break;
                    // 可以添加更多選擇菜單處理邏輯
                    default:
                        console.warn(`未知的選擇菜單ID: ${menuId}`);
                        await interaction.reply({
                            content: '無法處理此選擇。',
                            ephemeral: true
                        });
                }
            } catch (error) {
                console.error('處理選擇菜單交互時發生錯誤:', error);
                await interaction.reply({
                    content: '處理您的請求時發生錯誤。',
                    ephemeral: true
                });
            }
        }
    },
};

// 處理翻譯按鈕點擊的函數
async function handleTranslateButton(interaction) {
    // 實現翻譯按鈕的處理邏輯
    await interaction.reply({
        content: '翻譯功能正在開發中...',
        ephemeral: true
    });
}

// 處理語言選擇的函數
async function handleLanguageSelect(interaction) {
    // 獲取用戶選擇的值
    const selectedLanguage = interaction.values[0];
    
    // 實現語言選擇的處理邏輯
    await interaction.reply({
        content: `您選擇了: ${selectedLanguage}`,
        ephemeral: true
    });
}