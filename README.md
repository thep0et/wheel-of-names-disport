# Uplup Wheel Discord Bot 🎡

Spin wheels with server members, roles, reactions, and more! Features animated wheel GIFs that show the spin in real-time.

## Features

- **🎡 Animated Wheel GIFs** - Watch the wheel spin in Discord
- **👥 Spin with Members** - Pick from all server members or filter by role
- **🎭 Spin by Reactions** - Pick from users who reacted to a message
- **🎤 Spin Voice Channel** - Pick from members in a voice channel
- **✏️ Custom Entries** - Spin with any entries you want
- **💾 Saved Wheels** - Connect to Uplup to save and reuse wheels
- **🎨 Color Themes** - 5 beautiful color palettes

## Commands

### `/spin` - Quick Spins

| Subcommand | Description | Options |
|------------|-------------|---------|
| `/spin members` | Spin with server members | `role` (optional), `exclude_bots`, `color` |
| `/spin custom` | Spin with custom entries | `entries` (required), `color` |
| `/spin reactions` | Spin with message reactions | `message_id` (required), `emoji`, `color` |
| `/spin voice` | Spin with voice channel members | `channel`, `color` |

### `/wheel` - Saved Wheels (requires Uplup API)

| Subcommand | Description | Options |
|------------|-------------|---------|
| `/wheel list` | List your saved wheels | - |
| `/wheel spin` | Spin a saved wheel | `wheel_id` (required) |
| `/wheel create` | Create and save a new wheel | `name`, `entries` |
| `/wheel delete` | Delete a saved wheel | `wheel_id` |
| `/wheel info` | View wheel details | `wheel_id` |

## Color Themes

- **Uplup** (default) - Purple and pink
- **Vibrant** - Bold, bright colors
- **Pastel** - Soft, light colors
- **Sunset** - Warm oranges and pinks
- **Ocean** - Cool blues and teals

## Setup

### 1. Create a Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and name it "Uplup Wheel"
3. Go to "Bot" section and click "Add Bot"
4. Copy the **Bot Token** (keep this secret!)
5. Enable these **Privileged Gateway Intents**:
   - Server Members Intent
   - Message Content Intent
6. Go to "OAuth2" > "URL Generator"
   - Select scopes: `bot`, `applications.commands`
   - Select permissions: `Send Messages`, `Embed Links`, `Attach Files`, `Read Message History`, `Add Reactions`
7. Copy the generated URL and use it to add the bot to your server

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your credentials:

\`\`\`bash
cp .env.example .env
\`\`\`

\`\`\`env
# Required
DISCORD_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_application_id_here

# Optional - for saved wheels feature
UPLUP_API_KEY=your_uplup_api_key
UPLUP_API_SECRET=your_uplup_api_secret
\`\`\`

### 3. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 4. Deploy Commands

\`\`\`bash
npm run deploy
\`\`\`

### 5. Start the Bot

\`\`\`bash
npm start
\`\`\`

## Development

\`\`\`bash
# Run with hot reload
npm run dev

# Test GIF generation
npm run test-gif
\`\`\`

## Hosting Options

### Option 1: Railway (Recommended)
1. Connect your GitHub repo to [Railway](https://railway.app)
2. Add environment variables in Railway dashboard
3. Deploy!

### Option 2: DigitalOcean App Platform
1. Create a new app from GitHub
2. Set environment variables
3. Deploy as a worker (not web service)

### Option 3: VPS (AWS, DigitalOcean Droplet, etc.)
\`\`\`bash
# Install Node.js 18+
# Clone repo and install dependencies
npm install --production

# Run with PM2
npm install -g pm2
pm2 start index.js --name uplup-bot
pm2 save
pm2 startup
\`\`\`

## Getting Uplup API Access

To enable saved wheels:

1. Sign up at [uplup.com](https://uplup.com)
2. Upgrade to Boost plan ($29/mo) or higher
3. Go to Dashboard > API Integrations
4. Create an API key
5. Add key and secret to your `.env` file

## Support

- **Issues**: [GitHub Issues](https://github.com/uplup/uplup-discord-bot/issues)
- **Website**: [uplup.com](https://uplup.com)
- **Wheel Tool**: [uplup.com/random-name-picker](https://uplup.com/random-name-picker)

## License

MIT - Feel free to use and modify!