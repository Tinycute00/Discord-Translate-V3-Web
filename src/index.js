require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { initializeLocalization } = require('./utils/localization');


// 初始化本地化模組
initializeLocalization();

// 創建機器人客戶端
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent
  ],
  partials: [
    Partials.Message, 
    Partials.Channel, 
    Partials.Reaction
  ]
});

// 初始化命令集合
client.commands = new Collection();
client.cooldowns = new Map();

// 加載事件處理器
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
  
  console.log(`已載入事件：${event.name}`);
}

// 加載命令
const commandsPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(commandsPath);

for (const folder of commandFolders) {
  const folderPath = path.join(commandsPath, folder);
  const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
  
  for (const file of commandFiles) {
    const filePath = path.join(folderPath, file);
    const command = require(filePath);
    
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
      console.log(`已載入命令：${command.data.name}`);
    } else {
      console.log(`[警告] 命令 ${filePath} 缺少必要的 "data" 或 "execute" 屬性`);
    }
  }
}

// 登入 Discord
client.login(process.env.DISCORD_BOT_TOKEN)
  .then(() => console.log('機器人已成功登入！'))
  .catch(error => {
    console.error('機器人登入失敗：', error);
    process.exit(1);
  });

// 處理未捕獲的異常
process.on('unhandledRejection', error => {
  console.error('未處理的拒絕:', error);
});

module.exports = client;