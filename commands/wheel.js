import { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import { generateWheelGIF, generateWheelImage } from '../wheel-generator.js';

export const data = new SlashCommandBuilder()
  .setName('wheel')
  .setDescription('Manage and spin saved wheels')
  .addSubcommand(subcommand =>
    subcommand
      .setName('list')
      .setDescription('List your saved wheels from Uplup')
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('spin')
      .setDescription('Spin one of your saved wheels')
      .addStringOption(option =>
        option
          .setName('wheel_id')
          .setDescription('The wheel ID to spin (use /wheel list to find it)')
          .setRequired(true)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('create')
      .setDescription('Create a new wheel and save it to your Uplup account')
      .addStringOption(option =>
        option
          .setName('name')
          .setDescription('Name for the wheel')
          .setRequired(true)
      )
      .addStringOption(option =>
        option
          .setName('entries')
          .setDescription('Comma-separated list of entries')
          .setRequired(true)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('delete')
      .setDescription('Delete a saved wheel')
      .addStringOption(option =>
        option
          .setName('wheel_id')
          .setDescription('The wheel ID to delete')
          .setRequired(true)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('info')
      .setDescription('Get info about a saved wheel')
      .addStringOption(option =>
        option
          .setName('wheel_id')
          .setDescription('The wheel ID to view')
          .setRequired(true)
      )
  );

export async function execute(interaction, uplupAPI) {
  if (!uplupAPI) {
    await interaction.reply({
      content: '❌ **Uplup API not configured**\n\n' +
        'To use saved wheels, the bot owner needs to:\n' +
        '1. Get API credentials at **uplup.com/brand/api-integrations**\n' +
        '2. Add them to the `.env` file:\n' +
        '```\n' +
        'UPLUP_API_KEY=your_key\n' +
        'UPLUP_API_SECRET=your_secret\n' +
        '```\n' +
        '3. Restart the bot\n\n' +
        '💡 **Tip:** Use `/spin custom` instead - it works without API setup!',
      ephemeral: true
    });
    return;
  }

  await interaction.deferReply();

  const subcommand = interaction.options.getSubcommand();

  try {
    switch (subcommand) {
      case 'list': {
        const response = await uplupAPI.listWheels(25, 0);
        const wheels = response.data?.wheels || [];

        if (wheels.length === 0) {
          await interaction.editReply({
            content: '📭 You don\'t have any saved wheels yet!\n\nCreate one with `/wheel create` or at **uplup.com/random-name-picker**'
          });
          return;
        }

        const embed = new EmbedBuilder()
          .setColor(0x6C60D7)
          .setTitle('🎡 Your Saved Wheels')
          .setDescription(`Found **${wheels.length}** wheel${wheels.length !== 1 ? 's' : ''}`)
          .setFooter({
            text: 'Use /wheel spin <wheel_id> to spin a wheel',
            iconURL: 'https://uplup.com/favicon.ico'
          });

        // Add wheel list
        const wheelList = wheels.slice(0, 10).map((wheel, index) => {
          const entriesCount = wheel.entries_count || wheel.entries?.length || '?';
          return `**${index + 1}.** ${wheel.wheel_name}\n   ID: \`${wheel.wheel_id}\` • ${entriesCount} entries`;
        }).join('\n\n');

        embed.addFields({ name: 'Wheels', value: wheelList || 'No wheels found' });

        if (wheels.length > 10) {
          embed.addFields({
            name: '📋 More wheels',
            value: `Showing 10 of ${wheels.length}. Visit uplup.com to see all.`
          });
        }

        await interaction.editReply({ embeds: [embed] });
        break;
      }

      case 'spin': {
        const wheelId = interaction.options.getString('wheel_id');

        // Get wheel details first
        const wheelResponse = await uplupAPI.getWheel(wheelId);
        const wheel = wheelResponse.data;

        if (!wheel) {
          await interaction.editReply({
            content: '❌ Wheel not found. Check the wheel ID and try again.'
          });
          return;
        }

        const entries = wheel.entries || [];

        if (entries.length < 2) {
          await interaction.editReply({
            content: '❌ This wheel needs at least 2 entries to spin!'
          });
          return;
        }

        // Spin via API
        const spinResponse = await uplupAPI.spinWheel(wheelId);
        const winner = spinResponse.data.winner;

        // Generate animated GIF
        const gifBuffer = await generateWheelGIF(entries, {
          winner,
          colorPalette: 'uplup',
          duration: 4000,
          fps: 20,
          spinRevolutions: 4
        });

        const attachment = new AttachmentBuilder(gifBuffer, { name: 'wheel-spin.gif' });

        const embed = new EmbedBuilder()
          .setColor(0x6C60D7)
          .setTitle(`🎡 ${wheel.wheel_name}`)
          .setImage('attachment://wheel-spin.gif')
          .addFields(
            { name: '🎉 Winner', value: `**${winner}**`, inline: true },
            { name: '👥 Entries', value: `${entries.length}`, inline: true },
            { name: '🔢 Spin #', value: `${(wheel.total_spins || 0) + 1}`, inline: true }
          )
          .setFooter({
            text: 'Powered by Uplup • uplup.com/random-name-picker',
            iconURL: 'https://uplup.com/favicon.ico'
          })
          .setTimestamp();

        await interaction.editReply({
          embeds: [embed],
          files: [attachment]
        });
        break;
      }

      case 'create': {
        const name = interaction.options.getString('name');
        const entriesString = interaction.options.getString('entries');
        const entries = entriesString.split(',').map(e => e.trim()).filter(e => e.length > 0);

        if (entries.length < 2) {
          await interaction.editReply({
            content: '❌ You need at least 2 entries to create a wheel!'
          });
          return;
        }

        const response = await uplupAPI.createWheel(name, entries);
        const wheel = response.data;

        const embed = new EmbedBuilder()
          .setColor(0x4CAF50)
          .setTitle('✅ Wheel Created!')
          .addFields(
            { name: '📛 Name', value: wheel.wheel_name, inline: true },
            { name: '🆔 Wheel ID', value: `\`${wheel.wheel_id}\``, inline: true },
            { name: '👥 Entries', value: `${entries.length}`, inline: true }
          )
          .setDescription(`Use \`/wheel spin ${wheel.wheel_id}\` to spin this wheel!`)
          .setFooter({
            text: 'Powered by Uplup',
            iconURL: 'https://uplup.com/favicon.ico'
          });

        await interaction.editReply({ embeds: [embed] });
        break;
      }

      case 'delete': {
        const wheelId = interaction.options.getString('wheel_id');

        await uplupAPI.deleteWheel(wheelId);

        await interaction.editReply({
          content: `✅ Wheel \`${wheelId}\` has been deleted.`
        });
        break;
      }

      case 'info': {
        const wheelId = interaction.options.getString('wheel_id');
        const response = await uplupAPI.getWheel(wheelId);
        const wheel = response.data;

        if (!wheel) {
          await interaction.editReply({
            content: '❌ Wheel not found. Check the wheel ID and try again.'
          });
          return;
        }

        const entries = wheel.entries || [];
        const entriesList = entries.length <= 20
          ? entries.join(', ')
          : entries.slice(0, 20).join(', ') + ` ... and ${entries.length - 20} more`;

        // Generate static wheel image
        const imageBuffer = await generateWheelImage(
          entries.slice(0, 20),
          entries[0],
          { colorPalette: 'uplup' }
        );

        const attachment = new AttachmentBuilder(imageBuffer, { name: 'wheel-preview.png' });

        const embed = new EmbedBuilder()
          .setColor(0x6C60D7)
          .setTitle(`🎡 ${wheel.wheel_name}`)
          .setThumbnail('attachment://wheel-preview.png')
          .addFields(
            { name: '🆔 Wheel ID', value: `\`${wheel.wheel_id}\``, inline: true },
            { name: '👥 Entries', value: `${entries.length}`, inline: true },
            { name: '🔄 Total Spins', value: `${wheel.total_spins || 0}`, inline: true },
            { name: '📋 Entry List', value: entriesList || 'No entries' }
          )
          .setFooter({
            text: 'Use /wheel spin to spin this wheel',
            iconURL: 'https://uplup.com/favicon.ico'
          });

        if (wheel.created_at) {
          embed.addFields({
            name: '📅 Created',
            value: new Date(wheel.created_at).toLocaleDateString(),
            inline: true
          });
        }

        await interaction.editReply({
          embeds: [embed],
          files: [attachment]
        });
        break;
      }
    }
  } catch (error) {
    console.error('Wheel command error:', error);
    await interaction.editReply({
      content: `❌ An error occurred: ${error.message}`
    });
  }
}