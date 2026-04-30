import {
  SlashCommandBuilder,
  EmbedBuilder,
  AttachmentBuilder,
  ChannelType
} from 'discord.js';
import { generateWheelGIF } from '../wheel-generator.js';

const COLOR_CHOICES = [
  { name: 'Uplup (Purple/Pink)', value: 'uplup' },
  { name: 'Vibrant', value: 'vibrant' },
  { name: 'Pastel', value: 'pastel' },
  { name: 'Sunset', value: 'sunset' },
  { name: 'Ocean', value: 'ocean' }
];

export const data = new SlashCommandBuilder()
  .setName('spin')
  .setDescription('Spin a wheel to pick a random winner')

  .addSubcommand(subcommand =>
    subcommand
      .setName('custom')
      .setDescription('Spin with custom entries')
      .addStringOption(option =>
        option
          .setName('entries')
          .setDescription('Comma-separated list of entries')
          .setRequired(true)
      )
      .addStringOption(option =>
        option
          .setName('color')
          .setDescription('Color theme for the wheel')
          .setRequired(false)
          .addChoices(...COLOR_CHOICES)
      )
  )

  .addSubcommand(subcommand =>
    subcommand
      .setName('link')
      .setDescription('Spin entries extracted from a supported wheel link')
      .addStringOption(option =>
        option
          .setName('url')
          .setDescription('A public Spin The Wheel link')
          .setRequired(true)
      )
      .addStringOption(option =>
        option
          .setName('color')
          .setDescription('Color theme for the wheel')
          .setRequired(false)
          .addChoices(...COLOR_CHOICES)
      )
  )

  .addSubcommand(subcommand =>
    subcommand
      .setName('range')
      .setDescription('Spin a numbered range')
      .addStringOption(option =>
        option
          .setName('range')
          .setDescription('Number range, like 10-20 or 10 - 20')
          .setRequired(true)
      )
      .addNumberOption(option =>
        option
          .setName('increment')
          .setDescription('Step amount, like 1, 5, or 0.5. Default is 1.')
          .setRequired(false)
      )
      .addStringOption(option =>
        option
          .setName('type')
          .setDescription('Optional label, like gold, dollars, points, HP')
          .setRequired(false)
      )
      .addStringOption(option =>
        option
          .setName('color')
          .setDescription('Color theme for the wheel')
          .setRequired(false)
          .addChoices(...COLOR_CHOICES)
      )
  )

  .addSubcommand(subcommand =>
    subcommand
      .setName('reactions')
      .setDescription('Spin with users who reacted to a message')
      .addStringOption(option =>
        option
          .setName('message_id')
          .setDescription('The message ID to get reactions from')
          .setRequired(true)
      )
      .addStringOption(option =>
        option
          .setName('emoji')
          .setDescription('Only count this emoji')
          .setRequired(false)
      )
      .addStringOption(option =>
        option
          .setName('color')
          .setDescription('Color theme for the wheel')
          .setRequired(false)
          .addChoices(...COLOR_CHOICES)
      )
  )

  .addSubcommand(subcommand =>
    subcommand
      .setName('voice')
      .setDescription('Spin with members in a voice channel')
      .addChannelOption(option =>
        option
          .setName('channel')
          .setDescription('The voice channel')
          .addChannelTypes(ChannelType.GuildVoice, ChannelType.GuildStageVoice)
          .setRequired(false)
      )
      .addStringOption(option =>
        option
          .setName('color')
          .setDescription('Color theme for the wheel')
          .setRequired(false)
          .addChoices(...COLOR_CHOICES)
      )
  );

export async function execute(interaction, uplupAPI) {
  await interaction.deferReply();

  const subcommand = interaction.options.getSubcommand();
  const colorPalette = interaction.options.getString('color') || 'uplup';

  let entries = [];
  let wheelName = '';

  try {
    switch (subcommand) {
      case 'custom': {
        const entriesString = interaction.options.getString('entries', true);
        entries = parseCommaList(entriesString);
        wheelName = 'Custom Wheel';
        break;
      }

      case 'link': {
        const url = interaction.options.getString('url', true);
        const result = await extractSpinTheWheelEntries(url);
        entries = result.entries;
        wheelName = result.title ? `Link Wheel: ${result.title}` : 'Link Wheel';
        break;
      }

      case 'range': {
        const rangeString = interaction.options.getString('range', true);
        const increment = interaction.options.getNumber('increment') ?? 1;
        const type = interaction.options.getString('type')?.trim() || '';

        entries = buildRangeEntries(rangeString, increment, type);
        wheelName = type ? `Range Wheel (${type})` : 'Range Wheel';
        break;
      }

      case 'reactions': {
        const messageId = interaction.options.getString('message_id', true);
        const emojiFilter = interaction.options.getString('emoji');

        try {
          const message = await interaction.channel.messages.fetch(messageId);
          const reactions = message.reactions.cache;
          const users = new Set();

          for (const [reactionEmoji, reaction] of reactions) {
            if (emojiFilter && reactionEmoji !== emojiFilter) continue;

            const reactionUsers = await reaction.users.fetch();
            reactionUsers.forEach(user => {
              if (!user.bot) {
                users.add(user.username);
              }
            });
          }

          entries = Array.from(users);
          wheelName = 'Reaction Giveaway';
        } catch {
          await interaction.editReply({
            content: 'Could not find that message. Make sure the message ID is correct and the message is in this channel.'
          });
          return;
        }

        break;
      }

      case 'voice': {
        let voiceChannel = interaction.options.getChannel('channel');

        if (!voiceChannel) {
          const memberVoiceState = interaction.member.voice;
          if (!memberVoiceState.channel) {
            await interaction.editReply({
              content: 'You must be in a voice channel or specify a voice channel.'
            });
            return;
          }
          voiceChannel = memberVoiceState.channel;
        }

        const voiceMembers = voiceChannel.members.filter(member => !member.user.bot);
        entries = voiceMembers.map(member => member.displayName);
        wheelName = `${voiceChannel.name} Voice`;
        break;
      }
    }

    if (entries.length < 2) {
      await interaction.editReply({
        content: 'Need at least 2 entries to spin the wheel!'
      });
      return;
    }

    if (entries.length > 100) {
      entries = entries.slice(0, 100);
      wheelName += ' (Limited to 100)';
    }

    const winnerIndex = Math.floor(Math.random() * entries.length);
    const winner = entries[winnerIndex];

    const gifBuffer = await generateWheelGIF(entries, {
      winner,
      colorPalette,
      duration: 4000,
      fps: 20,
      spinRevolutions: 4
    });

    const attachment = new AttachmentBuilder(gifBuffer, {
      name: 'wheel-spin.gif'
    });

    const spinTimestamp = Math.floor(Date.now() / 1000);

    const embed = new EmbedBuilder()
      .setColor(0x6C60D7)
      .setTitle(wheelName)
      .setImage('attachment://wheel-spin.gif')
      .addFields(
        { name: 'Winner', value: `**${winner}**`, inline: true },
        { name: 'Entries', value: `${entries.length}`, inline: true },
        { name: 'Spun at', value: `<t:${spinTimestamp}:f>`, inline: true }
      )
      .setFooter({ text: 'App by thep0et' });

    if (uplupAPI) {
      try {
        const createResponse = await uplupAPI.createWheel(wheelName, entries);
        const wheelId = createResponse.data?.wheel_id;
        if (wheelId) {
          await uplupAPI.deleteWheel(wheelId);
        }
      } catch (apiError) {
        console.error('Uplup API logging failed:', apiError.message);
      }
    }

    await interaction.editReply({
      embeds: [embed],
      files: [attachment]
    });
  } catch (error) {
    console.error('Spin command error:', error);
    await interaction.editReply({
      content: `An error occurred: ${error.message}`
    });
  }
}

function parseCommaList(value) {
  return value
    .split(',')
    .map(entry => entry.trim())
    .filter(Boolean);
}

function buildRangeEntries(rangeString, increment, type) {
  if (!Number.isFinite(increment) || increment <= 0) {
    throw new Error('Increment must be greater than 0.');
  }

  const match = rangeString.match(/^\s*(-?\d+(?:\.\d+)?)\s*(?:-|to)\s*(-?\d+(?:\.\d+)?)\s*$/i);

  if (!match) {
    throw new Error('Range must look like `10-20`, `10 - 20`, or `10 to 20`.');
  }

  const start = Number(match[1]);
  const end = Number(match[2]);

  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    throw new Error('Range start and end must be valid numbers.');
  }

  const direction = start <= end ? 1 : -1;
  const step = increment * direction;
  const entries = [];

  let current = start;
  let safety = 0;

  while (
    direction > 0
      ? current <= end + Number.EPSILON
      : current >= end - Number.EPSILON
  ) {
    const normalized = normalizeNumber(current);
    entries.push(type ? `${normalized} ${type}` : String(normalized));
    current += step;

    safety += 1;
    if (safety > 1000) {
      throw new Error('Range produced too many values. Try a larger increment.');
    }
  }

  if (entries.length < 2) {
    throw new Error('Range must produce at least 2 entries.');
  }

  return entries;
}

function normalizeNumber(value) {
  return Number.parseFloat(value.toFixed(10));
}

async function extractSpinTheWheelEntries(urlString) {
  let url;

  try {
    url = new URL(urlString);
  } catch {
    throw new Error('That does not look like a valid URL.');
  }

  if (!url.hostname.endsWith('spinthewheel.app')) {
    throw new Error('For now, `/spin link` only supports public spinthewheel.app links.');
  }

  const response = await fetch(url.toString(), {
    headers: {
      'User-Agent': 'Mozilla/5.0 Discord Wheel Bot'
    }
  });

  if (!response.ok) {
    throw new Error(`Could not load that wheel link. HTTP ${response.status}.`);
  }

  const html = await response.text();
  const wheelData = extractSpinTheWheelSSRData(html);

  const title = typeof wheelData.Title === 'string'
    ? wheelData.Title.trim()
    : '';

  const entries = Array.isArray(wheelData.LabelsList)
    ? wheelData.LabelsList
        .map(entry => String(entry).trim())
        .filter(Boolean)
    : [];

  if (entries.length < 2) {
    throw new Error('I could not extract at least 2 entries from that link.');
  }

  return {
    title,
    entries
  };
}

function extractSpinTheWheelSSRData(html) {
  const match = html.match(
    /<script[^>]*id=["']ssr_data["'][^>]*type=["']application\/json["'][^>]*>\s*([\s\S]*?)\s*<\/script>/i
  );

  if (!match?.[1]) {
    throw new Error('Could not find Spin The Wheel page data.');
  }

  try {
    return JSON.parse(decodeHtmlEntities(match[1].trim()));
  } catch (error) {
    throw new Error(`Could not parse Spin The Wheel page data: ${error.message}`);
  }
}

function decodeHtmlEntities(value) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}