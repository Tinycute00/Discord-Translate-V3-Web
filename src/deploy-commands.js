/**
 * 斜線命令部署腳本
 * 用於手動註冊斜線命令到Discord
 */
require('dotenv').config();
const { REST, Routes, PermissionFlagsBits } = require('discord.js'); // Import PermissionFlagsBits
const fs = require('fs');
const path = require('path');

// 收集所有斜線命令
const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(commandsPath);

console.log('正在載入命令...');

for (const folder of commandFolders) {
  const folderPath = path.join(commandsPath, folder);

  if (fs.statSync(folderPath).isDirectory()) {
    const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
      const filePath = path.join(folderPath, file);
      try {
          const command = require(filePath);
          if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
            console.log(`已載入命令: ${command.data.name}`);
          } else {
            console.log(`[警告] 命令 ${filePath} 缺少必要的 "data" 或 "execute" 屬性`);
          }
      } catch (error) {
          console.error(`[錯誤] 無法載入命令 ${filePath}:`, error);
      }
    }
  }
}

// 檢查是否有命令要註冊
if (commands.length === 0) {
  console.log('沒有找到任何命令可供註冊');
  process.exit(0);
}

// 檢查必要的環境變數
if (!process.env.DISCORD_BOT_TOKEN || !process.env.DISCORD_CLIENT_ID) {
    console.error('[錯誤] 缺少必要的環境變數 DISCORD_BOT_TOKEN 或 DISCORD_CLIENT_ID');
    process.exit(1);
}

// 初始化REST API客戶端
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

// 部署命令
(async () => {
  try {
    console.log(`開始註冊 ${commands.length} 個斜線命令...`);

    // 決定是全局部署還是特定伺服器部署
    let data;
    const clientId = process.env.DISCORD_CLIENT_ID;
    const guildId = process.env.DISCORD_GUILD_ID; // Optional guild ID for testing

    if (guildId) {
      // 部署到特定伺服器
      data = await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commands }
      );
      console.log(`成功在伺服器 ${guildId} 註冊了 ${data.length} 個斜線命令`);
    } else {
      // 全局部署
      data = await rest.put(
        Routes.applicationCommands(clientId),
        { body: commands }
      );
      console.log(`成功全局註冊了 ${data.length} 個斜線命令`);
    }

    // --- 新增：生成並顯示邀請連結 ---
    // 計算權限值 (您可以根據實際需要調整這些權限)
    const permissions = [
        PermissionFlagsBits.ViewChannel,          // 讀取訊息/查看頻道
        PermissionFlagsBits.SendMessages,         // 發送訊息
        PermissionFlagsBits.EmbedLinks,           // 發送嵌入式連結
        PermissionFlagsBits.AttachFiles,          // 發送檔案
        PermissionFlagsBits.ReadMessageHistory,   // 讀取訊息歷史
        PermissionFlagsBits.AddReactions,         // 添加反應 (用於觸發)
        PermissionFlagsBits.UseExternalEmojis,     // 使用外部表情符號 (如果觸發符是自訂的)
        PermissionFlagsBits.ManageMessages        // 管理訊息 (用於刪除翻譯回覆)
    ].reduce((acc, perm) => acc | perm, 0n); // Use BigInt for permissions

    const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=${permissions}&scope=bot%20applications.commands`;

    console.log('\n========================================');
    console.log('機器人邀請連結 / Bot Invite Link:');
    console.log(inviteUrl);
    console.log('========================================');
    // --- 結束新增 ---

  } catch (error) {
    console.error('註冊命令時發生錯誤:', error);
  }
})();