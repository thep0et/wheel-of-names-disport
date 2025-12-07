/**
 * Deploy slash commands to Discord
 * Run this once to register commands, or whenever you update command definitions
 *
 * Usage: npm run deploy
 */

import 'dotenv/config';
import { REST, Routes } from 'discord.js';

// Import command definitions
import * as spinCommand from './commands/spin.js';
import * as wheelCommand from './commands/wheel.js';

const commands = [
  spinCommand.data.toJSON(),
  wheelCommand.data.toJSON()
];

// Validate environment variables
if (!process.env.DISCORD_TOKEN || !process.env.DISCORD_CLIENT_ID) {
  console.error('❌ Missing DISCORD_TOKEN or DISCORD_CLIENT_ID in .env file');
  process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

async function deployCommands() {
  try {
    console.log(`🔄 Started refreshing ${commands.length} application (/) commands.`);

    // Deploy globally (takes up to 1 hour to propagate)
    const data = await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
      { body: commands }
    );

    console.log(`✅ Successfully reloaded ${data.length} application (/) commands.`);
    console.log('\nRegistered commands:');
    data.forEach(cmd => {
      console.log(`   /${cmd.name} - ${cmd.description}`);
    });

    console.log('\n⏳ Note: Global commands can take up to 1 hour to appear in all servers.');
    console.log('   For instant testing, use guild-specific commands (see documentation).');

  } catch (error) {
    console.error('❌ Error deploying commands:', error);
    process.exit(1);
  }
}

// Run deployment
deployCommands();