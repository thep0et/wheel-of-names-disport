/**
 * Uplup Discord Bot
 * Spin wheels with server members, roles, reactions, and more!
 *
 * Features:
 * - Animated wheel GIF generation
 * - Spin with server members or roles
 * - Spin with message reactions
 * - Spin with voice channel members
 * - Custom entries
 * - Saved wheels via Uplup API
 * - Multiple color themes
 */

import 'dotenv/config';
import { Client, Collection, Events, GatewayIntentBits, REST, Routes } from 'discord.js';
import { UplupAPI } from './uplup-api.js';

// Import commands
import * as spinCommand from './commands/spin.js';
import * as wheelCommand from './commands/wheel.js';

// Validate environment variables
const requiredEnvVars = ['DISCORD_TOKEN', 'DISCORD_CLIENT_ID'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Initialize Uplup API client (optional - for logging and saved wheels)
// Uses Bearer token auth with API key only (no secret needed).
// API keys look like: uplup_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
let uplupAPI = null;
if (process.env.UPLUP_API_KEY) {
  uplupAPI = new UplupAPI(
    process.env.UPLUP_API_KEY,
    process.env.UPLUP_API_BASE_URL || 'https://api.uplup.com/api/v1'
  );
  console.log('✅ Uplup API integration enabled');
} else {
  console.log('⚠️  Uplup API not configured - saved wheels disabled');
}

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates
  ]
});

// Register commands
client.commands = new Collection();
const commands = [spinCommand, wheelCommand];

for (const command of commands) {
  client.commands.set(command.data.name, command);
}

// Ready event
client.once(Events.ClientReady, async (readyClient) => {
  console.log(`\n🎡 Uplup Wheel Bot is online!`);
  console.log(`   Logged in as: ${readyClient.user.tag}`);
  console.log(`   Serving ${readyClient.guilds.cache.size} servers`);
  console.log(`   Commands: /spin, /wheel`);
  console.log(`\n   Add to your server:`);
  console.log(`   https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&permissions=274878024768&scope=bot%20applications.commands\n`);

  // Set activity
  readyClient.user.setActivity('/spin to pick a winner!', { type: 0 });
});

// Interaction handler
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction, uplupAPI);
  } catch (error) {
    console.error(`Error executing ${interaction.commandName}:`, error);

    const errorMessage = {
      content: '❌ There was an error while executing this command!',
      ephemeral: true
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
});

// Error handling
client.on(Events.Error, (error) => {
  console.error('Discord client error:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

// Login
client.login(process.env.DISCORD_TOKEN);