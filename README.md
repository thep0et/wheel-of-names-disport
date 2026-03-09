# Wheel of Names Discord Bot

A free, open-source, **self-hosted wheel of names Discord bot** for spinning random name pickers directly in your server. Perfect for giveaways, raffles, random selections, and picking winners from your community.

Looking for a **Discord wheel of names** solution? This self-hosted bot brings the popular wheel picker experience to Discord with animated GIF spins, custom entries, and seamless integration with [Uplup's Random Name Picker](https://uplup.com/random-name-picker). Host it yourself on Railway, DigitalOcean, or any VPS for full control over your data.

## Why Use This Wheel of Names Bot for Discord?

- **Self-Hosted & Open Source** - Full control over your bot and data, host anywhere
- **Animated Wheel Spins** - Watch the name wheel spin in real-time with GIF animations
- **Random Name Picker** - Fairly pick random winners from server members, roles, or custom lists
- **Giveaway Ready** - Perfect for Discord giveaways with reaction-based entry
- **Voice Channel Support** - Pick random members from voice channels
- **Saved Wheels** - Create and reuse your wheel picker configurations
- **Multiple Color Themes** - 5 beautiful color palettes to match your server

## Features

### Spin Types
- **Server Members** - Random name picker from all members or filtered by role
- **Custom Entries** - Wheel of names with any entries you provide
- **Reaction Picker** - Pick winners from users who reacted to a message
- **Voice Channel** - Random selection from voice channel participants

### Wheel Customization
- 5 color themes (Uplup, Vibrant, Pastel, Sunset, Ocean)
- Animated wheel GIF generation
- Winner history tracking
- Saved wheel configurations

---

## Quick Start

### 1. Create a Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **"New Application"** and name it (e.g., "Wheel of Names Bot")
3. Go to **"Bot"** section and click **"Add Bot"**
4. Click **"Reset Token"** and copy the **Bot Token** (keep this secret!)
5. Enable these **Privileged Gateway Intents**:
   - Server Members Intent
   - Message Content Intent
6. Copy your **Application ID** from the "General Information" page

### 2. Get Your Uplup API Keys (Free)

API access is **free** and enables saved wheels, plan-based limits, and usage tracking.

1. **Create an account** at [uplup.com/random-name-picker](https://uplup.com/random-name-picker) (click "Sign Up" - it's free)
2. After logging in, go to **Dashboard > API Integrations > API Keys**
3. Click **"Create API Key"**
4. Give it a name like "Discord Bot"
5. **Important**: Copy both the **API Key** and **API Secret** immediately - the secret is only shown once!

**Free plan limits**: 100 API requests/hour, 100 names/wheel, 3 saved wheels
**Boost plan ($29/mo)**: Unlimited requests, unlimited names, unlimited wheels

### 3. Configure the Bot

```bash
# Clone the repository
git clone https://github.com/Uplup/discord-wheel-of-names.git
cd discord-wheel-of-names

# Copy the example environment file
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Discord Configuration (Required)
DISCORD_TOKEN=paste_your_bot_token_here
DISCORD_CLIENT_ID=paste_your_application_id_here

# Uplup API Configuration (Required for saved wheels & limits)
UPLUP_API_KEY=uplup_live_xxxxxxxxxxxxxxxx
UPLUP_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
UPLUP_API_BASE_URL=https://api.uplup.com/api/wheel
```

### 4. Install & Run

```bash
# Install dependencies
npm install

# Deploy slash commands to Discord
npm run deploy

# Start the bot
npm start
```

### 5. Add Bot to Your Server

The bot will print an invite URL when it starts:
```
Add to your server:
https://discord.com/api/oauth2/authorize?client_id=YOUR_ID&permissions=274878024768&scope=bot%20applications.commands
```

Click that link and select your server!

---

## Commands

### `/spin` - Quick Random Name Picker

| Subcommand | Description | Options |
|------------|-------------|---------|
| `/spin members` | Random name picker from server members | `role` (optional), `exclude_bots`, `color` |
| `/spin custom` | Wheel of names with custom entries | `entries` (required), `color` |
| `/spin reactions` | Pick winner from message reactions | `message_id` (required), `emoji`, `color` |
| `/spin voice` | Random picker from voice channel | `channel`, `color` |

### `/wheel` - Saved Wheel Picker (requires Uplup API)

| Subcommand | Description | Options |
|------------|-------------|---------|
| `/wheel list` | List your saved name wheels | - |
| `/wheel spin` | Spin a saved wheel of names | `wheel_id` (required) |
| `/wheel create` | Create and save a new wheel | `name`, `entries` |
| `/wheel delete` | Delete a saved wheel | `wheel_id` |
| `/wheel info` | View wheel details | `wheel_id` |

### Color Themes

- **Uplup** (default) - Purple and pink
- **Vibrant** - Bold, bright colors
- **Pastel** - Soft, light colors
- **Sunset** - Warm oranges and pinks
- **Ocean** - Cool blues and teals

---

## Use Cases

### Discord Giveaways
Run fair giveaways by picking random winners from reactions:
```
/spin reactions message_id:123456789
```

### Classroom Random Name Picker
Teachers can pick random students for participation:
```
/spin members role:@Students
```

### Gaming Team Selection
Randomly assign players to teams from voice chat:
```
/spin voice channel:#gaming-lobby
```

### Raffle & Contest Winners
Pick winners from custom entry lists:
```
/spin custom entries:Alice, Bob, Charlie, Diana
```

---

## Wheel Picker API

This bot is powered by the [Uplup Wheel Picker API](https://uplup.com/api#wheel-api) — a full REST API with **33 endpoints** for creating, managing, and spinning wheels programmatically. You can use the same API to build your own integrations beyond Discord.

### Free Plan — What You Get

API access is **free on all plans**, and the Free tier is generous:

| | Free Plan |
|--|-----------|
| **Access** | Read-only |
| **Rate limit** | 2/second, 60/minute, 1,000/hour |
| **API keys** | 1 |
| **Names per wheel** | 100 |
| **Saved wheels** | 3 |
| **`/spin` commands** | Unlimited |

Higher limits, write access, webhooks, and sharing are available on [paid plans](https://uplup.com/pricing). See [rate limiting details](https://uplup.com/api#rate-limiting) for the full breakdown.

### Authentication

All requests use Bearer token authentication:

```
Authorization: Bearer uplup_live_your_key_here
```

Get your free API key: Sign up at [uplup.com](https://uplup.com/random-name-picker) → Dashboard → API Integrations → Create API Key.

### API Base URL

```
https://api.uplup.com/api/v1/wheels
```

### Endpoints Overview

The API covers **33 endpoints** across 8 categories:

#### Wheels (CRUD)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/wheels` | List all wheels (paginated, filterable by status) |
| `POST` | `/wheels` | Create a new wheel |
| `GET` | `/wheels/{id}` | Get wheel with all entries, settings, and winners |
| `PUT` | `/wheels/{id}` | Update wheel name, entries, or settings |
| `DELETE` | `/wheels/{id}` | Delete a wheel |
| `POST` | `/wheels/{id}/clone` | Clone a wheel |
| `POST` | `/wheels/{id}/archive` | Archive a wheel |
| `POST` | `/wheels/{id}/restore` | Restore an archived wheel |

#### Entries

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/wheels/{id}/entries` | Get all entries (shows source: manual or CSV) |
| `POST` | `/wheels/{id}/entries` | Append new entries to a wheel |
| `PUT` | `/wheels/{id}/entries` | Replace all entries |
| `DELETE` | `/wheels/{id}/entries` | Remove entries by index or name |

#### Spins & Results

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/wheels/{id}/spin` | Record a spin with winner |
| `GET` | `/wheels/{id}/results` | Get all winners with timestamps |
| `DELETE` | `/wheels/{id}/results` | Clear all results |
| `GET` | `/wheels/{id}/history` | Full action history (filterable by date range) |
| `GET` | `/wheels/{id}/stats` | Spin stats: total spins, unique winners, recent history |

#### Appearance & Settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/wheels/{id}/settings` | Get all wheel settings |
| `PUT` | `/wheels/{id}/settings` | Update settings (colors, audio, confetti, teams, etc.) |
| `PUT` | `/wheels/{id}/appearance` | Update visual appearance (colors, fonts, needle style) |
| `GET` | `/wheels/{id}/background` | Get background image |
| `PUT` | `/wheels/{id}/background` | Set background image |
| `DELETE` | `/wheels/{id}/background` | Remove background image |

#### Sharing & Embedding

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/wheels/{id}/share` | Get share URL and public status |
| `PUT` | `/wheels/{id}/share` | Make wheel public or private |
| `GET` | `/wheels/{id}/embed` | Get iframe embed code for websites |

#### Webhooks (8 event types)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/webhooks` | List all webhooks |
| `POST` | `/webhooks` | Create webhook (events: `spin.completed`, `winner.selected`, `wheel.created`, etc.) |
| `GET` | `/webhooks/{id}` | Get webhook details with recent delivery log |
| `PUT` | `/webhooks/{id}` | Update webhook URL or toggle active/inactive |
| `DELETE` | `/webhooks/{id}` | Delete webhook |
| `POST` | `/webhooks/{id}/test` | Send test payload and verify delivery |

**Webhook events:** `wheel.created`, `wheel.updated`, `wheel.deleted`, `spin.completed`, `winner.selected`, `entries.changed`, `entries.added`, `entries.removed`

#### Account

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/account` | Plan info, usage, limits, and feature flags |

### Quick Examples

**List your wheels:**
```bash
curl https://api.uplup.com/api/v1/wheels \
  -H "Authorization: Bearer uplup_live_your_key_here"
```

**Create a wheel:**
```bash
curl -X POST https://api.uplup.com/api/v1/wheels \
  -H "Authorization: Bearer uplup_live_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "wheel_name": "Lunch Picker",
    "entries": ["Pizza", "Sushi", "Tacos", "Burgers", "Salad"],
    "settings": {
      "selectedColorSet": "vibrant",
      "enableConfetti": true,
      "removeAfterWin": false
    }
  }'
```

**Get wheel stats:**
```bash
curl https://api.uplup.com/api/v1/wheels/WHEEL_ID/stats \
  -H "Authorization: Bearer uplup_live_your_key_here"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "total_spins": 42,
      "unique_winners": 5,
      "total_entries": 8,
      "recent_history": [
        { "winner": "Pizza", "spin_timestamp": "2026-03-09T14:51:00Z" }
      ]
    }
  }
}
```

**Add entries to an existing wheel:**
```bash
curl -X POST https://api.uplup.com/api/v1/wheels/WHEEL_ID/entries \
  -H "Authorization: Bearer uplup_live_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{"entries": ["Ramen", "Pho", "Pasta"]}'
```

Full API documentation: **[uplup.com/api#wheel-api](https://uplup.com/api#wheel-api)**

---

## Hosting Options

### Option 1: Railway (Recommended)
1. Fork this repo to your GitHub
2. Connect to [Railway](https://railway.app)
3. Add environment variables in Railway dashboard
4. Deploy!

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template)

### Option 2: DigitalOcean App Platform
1. Create a new app from GitHub
2. Set environment variables
3. Deploy as a worker (not web service)

### Option 3: VPS (AWS, DigitalOcean Droplet, etc.)
```bash
# Install Node.js 18+
# Clone repo and install dependencies
npm install --production

# Run with PM2 for auto-restart
npm install -g pm2
pm2 start index.js --name wheel-of-names-bot
pm2 save
pm2 startup
```

---

## Development

```bash
# Run with auto-reload (development)
npm run dev

# Test GIF generation locally
npm run test-gif
```

---

## Troubleshooting

### "Uplup API not configured"
Make sure you've added both `UPLUP_API_KEY` and `UPLUP_API_SECRET` to your `.env` file.

### "This command requires Uplup API integration"
The `/wheel` commands need API keys configured. The `/spin` commands work without API keys.

### Bot doesn't respond to commands
1. Make sure you ran `npm run deploy` after any command changes
2. Check that the bot has proper permissions in the channel
3. Verify the bot is online (green status)

### "Missing Server Members Intent"
Enable **Server Members Intent** in Discord Developer Portal > Bot settings.

---

## Related Tools

- **[Random Name Picker](https://uplup.com/random-name-picker)** - Web-based wheel of names tool
- **[Wheel Picker API](https://uplup.com/api#wheel-api)** - REST API for wheel integrations (free access included)
- **[API Rate Limiting](https://uplup.com/api#rate-limiting)** - Rate limits and free tier details
- **[Giveaway Tool](https://uplup.com/giveaway)** - Full-featured contest platform

---

## Support

- **Issues**: [GitHub Issues](https://github.com/Uplup/discord-wheel-of-names/issues)
- **Website**: [uplup.com](https://uplup.com)
- **Name Picker**: [uplup.com/random-name-picker](https://uplup.com/random-name-picker)
- **API Docs**: [uplup.com/api#wheel-api](https://uplup.com/api#wheel-api)

---

## Keywords

wheel of names discord bot, discord wheel of names, wheel of names bot discord, random name picker discord, name wheel discord, wheel picker bot, discord random picker, discord giveaway wheel, spin the wheel discord bot, name picker bot

---

## License

MIT - Feel free to use and modify!
