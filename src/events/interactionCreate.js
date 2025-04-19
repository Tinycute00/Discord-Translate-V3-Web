/**
 * 互動事件處理器
 * 用於處理斜線命令和其他互動
 */
const { getText } = require('../utils/localization'); // <--- 引入 getText

module.exports = {
  name: 'interactionCreate',
  on: true,
  async execute(interaction, client) {
    // 只處理斜線命令互動 / Only process slash command interactions
    if (!interaction.isChatInputCommand()) return;

    // 獲取命令名稱 / Get command name
    const commandName = interaction.commandName;
    
    try {
      // 從命令集合中獲取命令 / Get command from collection
      const command = client.commands.get(commandName);
      
      // 如果命令不存在 / If command doesn't exist
      if (!command) {
        console.log(`找不到命令 ${commandName}`);
        // 只在互動尚未回應時嘗試回應 / Only try to reply if interaction hasn't been responded to
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: getText('error_command_not_found'),
            ephemeral: true
          });
        }
        return;
      }
      
      // 執行命令 / Execute command
      await command.execute(interaction);
      
    } catch (error) {
      console.error(`執行命令 ${commandName} 時發生錯誤:`, error);
      
      // 只在互動尚未回應時嘗試回應 / Only try to reply if interaction hasn't been responded to
      try {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: getText('error_command_execution_generic'),
            ephemeral: true
          });
        } else if (interaction.deferred && !interaction.replied) {
          // 如果互動已延遲但未回應，則編輯回覆 / If interaction was deferred but not replied, edit the reply
          await interaction.editReply({
            content: getText('error_command_execution_generic')
          });
        }
      } catch (replyError) {
        console.error('回應錯誤時出現問題:', replyError);
      }
    }
  }
};