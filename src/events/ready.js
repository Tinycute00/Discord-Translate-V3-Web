/**
 * 機器人就緒事件處理
 */
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    // 顯示機器人上線信息
    console.log(`已登入為 ${client.user.tag}，準備監聽反應！`);
    console.log(`目前版本: 1.0.0`);
    
    try {
      // 註冊斜線命令
      await registerCommands(client);
    } catch (error) {
      console.error('註冊斜線命令時發生錯誤:', error);
    }
  }
};

/**
 * 註冊斜線命令
 * @param {Object} client - Discord.js 客戶端
 */
async function registerCommands(client) {
  const commands = [];
  const commandsPath = path.join(__dirname, '..', 'commands');
  const commandFolders = fs.readdirSync(commandsPath);

  // 收集所有命令的data
  for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);
    if (fs.statSync(folderPath).isDirectory()) {
      const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
      
      for (const file of commandFiles) {
        const filePath = path.join(folderPath, file);
        const command = require(filePath);
        
        if ('data' in command) {
          commands.push(command.data.toJSON());
        }
      }
    }
  }

  // 創建REST API實例
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

  try {
    console.log(`開始註冊 ${commands.length} 個斜線命令...`);

    // 定義註冊方式：全局或特定伺服器
    let data;
    if (process.env.DISCORD_GUILD_ID) {
      // 註冊到特定伺服器
      data = await rest.put(
        Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_GUILD_ID),
        { body: commands }
      );
      console.log(`成功在伺服器 ${process.env.DISCORD_GUILD_ID} 註冊了 ${data.length} 個斜線命令`);
    } else {
      // 全局註冊
      data = await rest.put(
        Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
        { body: commands }
      );
      console.log(`成功全局註冊了 ${data.length} 個斜線命令`);
    }
  } catch (error) {
    console.error('註冊斜線命令時發生錯誤:', error);
  }
}