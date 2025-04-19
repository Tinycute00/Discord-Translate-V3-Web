# Discord Translate V3 Web

A Discord translation bot with web interface that provides real-time translation services using emoji reactions.

## Features

- Multi-language translation support
- Web interface for bot management
- Discord OAuth2 integration
- Emoji-triggered translations
- SQLite database for data persistence

## Prerequisites

- Node.js >= 16.11.0
- Discord Bot Token
- Discord Application OAuth2 credentials

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Tinycute00/Discord-Translate-V3-Web.git
cd Discord-Translate-V3-Web
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with the following variables:
```env
# Discord Bot Configuration
DISCORD_TOKEN=your_bot_token
CLIENT_ID=your_client_id
GUILD_ID=your_guild_id

# Web Server Configuration
PORT=3000
SESSION_SECRET=your_session_secret

# OAuth2 Configuration
OAUTH2_CLIENT_ID=your_oauth2_client_id
OAUTH2_CLIENT_SECRET=your_oauth2_client_secret
OAUTH2_REDIRECT_URI=http://localhost:3000/auth/discord/callback
```

4. Deploy slash commands:
```bash
npm run deploy
```

5. Start the bot:
```bash
npm start
```

For development:
```bash
npm run dev
```

## Project Structure

```
├── data/           # Database and other data files
├── docs/           # Documentation
├── src/
│   ├── commands/   # Bot commands
│   │   ├── bot/    # Bot-specific commands
│   │   └── settings/ # Settings commands
│   ├── database/   # Database operations
│   ├── events/     # Discord.js event handlers
│   ├── utils/      # Utility functions
│   └── web/        # Web interface
│       ├── public/ # Static files
│       └── views/  # Web views
```

## Usage

1. Invite the bot to your server using the OAuth2 URL
2. Use emoji reactions on messages to trigger translations
3. Access the web interface for advanced settings and management

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the ISC License.