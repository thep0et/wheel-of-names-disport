import {
  SlashCommandBuilder,
  ChannelType,
  PermissionFlagsBits
} from 'discord.js';

const CONFIG_MARKER = 'WHEEL_BOT_CONFIG_v1';
const DEFAULT_SPIN_CHANNEL_NAME = 'wheel-spin';
const DEFAULT_SAVED_CHANNEL_NAME = 'saved-wheels';

export const data = new SlashCommandBuilder()
  .setName('wheel')
  .setDescription('Manage saved wheels for this server')

  .addSubcommandGroup(group =>
    group
      .setName('setup')
      .setDescription('Configure saved wheel channels for this server')

      .addSubcommand(subcommand =>
        subcommand
          .setName('create')
          .setDescription('Create the wheel channels automatically')
          .addRoleOption(option =>
            option
              .setName('manager_role')
              .setDescription('Role allowed to create, edit, and delete wheels')
              .setRequired(false)
          )
      )

      .addSubcommand(subcommand =>
        subcommand
          .setName('existing')
          .setDescription('Use channels that already exist')
          .addChannelOption(option =>
            option
              .setName('spin_channel')
              .setDescription('Channel where wheel results should be posted')
              .addChannelTypes(ChannelType.GuildText)
              .setRequired(true)
          )
          .addChannelOption(option =>
            option
              .setName('saved_channel')
              .setDescription('Channel where saved wheels and config should be stored')
              .addChannelTypes(ChannelType.GuildText)
              .setRequired(true)
          )
          .addRoleOption(option =>
            option
              .setName('manager_role')
              .setDescription('Role allowed to create, edit, and delete wheels')
              .setRequired(false)
          )
      )
  )

  .addSubcommand(subcommand =>
    subcommand
      .setName('list')
      .setDescription('List saved wheels for this server')
  )

  .addSubcommand(subcommand =>
    subcommand
      .setName('create')
      .setDescription('Create a saved wheel for this server')
      .addStringOption(option =>
        option
          .setName('name')
          .setDescription('Unique name for the wheel')
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
          .setName('name')
          .setDescription('Name of the wheel to delete')
          .setRequired(true)
      )
  )

  .addSubcommand(subcommand =>
    subcommand
      .setName('spin')
      .setDescription('Spin a saved wheel')
      .addStringOption(option =>
        option
          .setName('name')
          .setDescription('Name of the wheel to spin')
          .setRequired(true)
      )
  );

function getMissingChannelPerms(channel, me, requiredPerms) {
  const perms = channel.permissionsFor(me);
  if (!perms) return requiredPerms;

  return requiredPerms.filter(perm => !perms.has(perm));
}

export async function execute(interaction) {
  const group = interaction.options.getSubcommandGroup(false);
  const subcommand = interaction.options.getSubcommand();

  try {
    if (group === 'setup') {
      await handleSetup(interaction, subcommand);
      return;
    }

    const config = await getGuildConfig(interaction.guild, interaction.client.user.id);

    if (!config) {
      await interaction.reply({
        content: '❌ Saved wheels are not set up for this server yet. Run `/wheel setup create` or `/wheel setup existing` first.',
        ephemeral: true
      });
      return;
    }

    switch (subcommand) {
      case 'list':
        await handleList(interaction, config);
        return;

      case 'create':
        await handleCreateWheel(interaction, config);
        return;

      case 'delete':
        await handleDeleteWheel(interaction, config);
        return;

      case 'spin':
        await interaction.reply({
          content: `✅ Setup found.\nSpin channel: <#${config.wheelSpinChannelId}>\nSaved wheels channel: <#${config.savedWheelsChannelId}>\n\nSaved wheel spinning is the next piece to wire in.`,
          ephemeral: true
        });
        return;

      default:
        await interaction.reply({
          content: '❌ Unknown /wheel command.',
          ephemeral: true
        });
    }
  } catch (error) {
    console.error('Wheel command error:', error);

    const payload = {
      content: `❌ An error occurred: ${error.message}`,
      ephemeral: true
    };

    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(payload);
    } else {
      await interaction.reply(payload);
    }
  }
}

async function handleSetup(interaction, subcommand) {
  if (!isWheelAdmin(interaction.member)) {
    await interaction.reply({
      content: '❌ You must be a server admin to run `/wheel setup`.',
      ephemeral: true
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  let spinChannel;
  let savedChannel;

  if (subcommand === 'create') {
    const existingSpin = interaction.guild.channels.cache.find(
      c => c.type === ChannelType.GuildText && c.name === DEFAULT_SPIN_CHANNEL_NAME
    );
    const existingSaved = interaction.guild.channels.cache.find(
      c => c.type === ChannelType.GuildText && c.name === DEFAULT_SAVED_CHANNEL_NAME
    );

    if (existingSpin || existingSaved) {
      await interaction.editReply({
        content: '❌ One or both default wheel channels already exist. Use `/wheel setup existing` to register them instead.'
      });
      return;
    }

    spinChannel = await interaction.guild.channels.create({
      name: DEFAULT_SPIN_CHANNEL_NAME,
      type: ChannelType.GuildText,
      reason: `Wheel setup created by ${interaction.user.tag}`
    });

    savedChannel = await interaction.guild.channels.create({
      name: DEFAULT_SAVED_CHANNEL_NAME,
      type: ChannelType.GuildText,
      reason: `Wheel setup created by ${interaction.user.tag}`
    });
  } else {
    spinChannel = interaction.options.getChannel('spin_channel', true);
    savedChannel = interaction.options.getChannel('saved_channel', true);
  }

  const managerRole = interaction.options.getRole('manager_role');
  const configMessage = await upsertGuildConfig({
    guild: interaction.guild,
    botUserId: interaction.client.user.id,
    savedChannel,
    spinChannel,
    managerRoleId: managerRole?.id ?? null
  });

  await interaction.editReply({
    content:
      `✅ Wheel system configured.\n\n` +
      `Spin channel: ${spinChannel}\n` +
      `Saved wheels channel: ${savedChannel}\n` +
      `Manager role: ${managerRole ? `<@&${managerRole.id}>` : 'None'}\n` +
      `Config message: https://discord.com/channels/${interaction.guild.id}/${savedChannel.id}/${configMessage.id}`
  });
}

async function handleList(interaction, config) {
  await interaction.deferReply({ ephemeral: true });

  const savedChannel = await interaction.guild.channels.fetch(config.savedWheelsChannelId);
  if (!savedChannel || savedChannel.type !== ChannelType.GuildText) {
    await interaction.editReply({
      content: '❌ The saved wheels channel no longer exists. Run `/wheel setup` again.'
    });
    return;
  }

  const messages = await savedChannel.messages.fetch({ limit: 100 });
  const wheelMessages = messages.filter(message => {
    return (
      message.author.id === interaction.client.user.id &&
      message.content.includes('"type": "wheel"')
    );
  });

  if (wheelMessages.size === 0) {
    await interaction.editReply({
      content: 'No saved wheels found yet.'
    });
    return;
  }

  const lines = [];
  for (const message of wheelMessages.values()) {
    const wheel = extractFirstJsonBlock(message.content);
    if (!wheel || wheel.type !== 'wheel') continue;
    lines.push(`• **${wheel.name}** (${wheel.entries.length} entries)`);
  }

  await interaction.editReply({
    content: lines.length ? lines.join('\n') : 'No saved wheels found yet.'
  });
}

async function handleCreateWheel(interaction, config) {
  if (!canManageWheels(interaction.member, config.managerRoleId)) {
    await interaction.reply({
      content: '❌ You do not have permission to create saved wheels in this server.',
      ephemeral: true
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  const name = interaction.options.getString('name', true).trim();
  const entries = interaction.options
    .getString('entries', true)
    .split(',')
    .map(entry => entry.trim())
    .filter(Boolean);

  if (entries.length < 2) {
    await interaction.editReply({
      content: '❌ A saved wheel needs at least 2 entries.'
    });
    return;
  }

  if (entries.length > 100) {
    await interaction.editReply({
      content: '❌ Maximum 100 entries per wheel.'
    });
    return;
  }

  const savedChannel = await interaction.guild.channels.fetch(config.savedWheelsChannelId);
  if (!savedChannel || savedChannel.type !== ChannelType.GuildText) {
    await interaction.editReply({
      content: '❌ The saved wheels channel no longer exists. Run `/wheel setup` again.'
    });
    return;
  }

  const existing = await findWheelMessageByName(savedChannel, interaction.client.user.id, name);
  if (existing) {
    await interaction.editReply({
      content: `❌ A saved wheel named **${name}** already exists.`
    });
    return;
  }

  const wheelRecord = {
    type: 'wheel',
    version: 1,
    guildId: interaction.guild.id,
    name,
    entries,
    createdBy: interaction.user.id,
    updatedBy: interaction.user.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const message = await savedChannel.send({
    content: renderWheelRecord(wheelRecord)
  });

  await interaction.editReply({
    content: `✅ Saved wheel **${name}** created in ${savedChannel}.\nMessage ID: \`${message.id}\``
  });
}

async function handleDeleteWheel(interaction, config) {
  if (!canManageWheels(interaction.member, config.managerRoleId)) {
    await interaction.reply({
      content: '❌ You do not have permission to delete saved wheels in this server.',
      ephemeral: true
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  const name = interaction.options.getString('name', true).trim();
  const savedChannel = await interaction.guild.channels.fetch(config.savedWheelsChannelId);

  if (!savedChannel || savedChannel.type !== ChannelType.GuildText) {
    await interaction.editReply({
      content: '❌ The saved wheels channel no longer exists. Run `/wheel setup` again.'
    });
    return;
  }

  const existing = await findWheelMessageByName(savedChannel, interaction.client.user.id, name);
  if (!existing) {
    await interaction.editReply({
      content: `❌ Could not find a saved wheel named **${name}**.`
    });
    return;
  }

  await existing.delete();

  await interaction.editReply({
    content: `✅ Deleted saved wheel **${name}**.`
  });
}

function isWheelAdmin(member) {
  return (
    member.permissions.has(PermissionFlagsBits.Administrator) ||
    member.permissions.has(PermissionFlagsBits.ManageGuild)
  );
}

function canManageWheels(member, managerRoleId) {
  if (isWheelAdmin(member)) return true;
  if (!managerRoleId) return false;
  return member.roles.cache.has(managerRoleId);
}

async function getGuildConfig(guild, botUserId) {
  const textChannels = guild.channels.cache.filter(channel => channel.type === ChannelType.GuildText);

  for (const channel of textChannels.values()) {
    try {
      const pinned = await channel.messages.fetchPinned();
      const configMessage = pinned.find(message => {
        return (
          message.author.id === botUserId &&
          message.content.includes(CONFIG_MARKER) &&
          message.content.includes('"type": "wheelBotConfig"')
        );
      });

      if (!configMessage) continue;

      const config = extractFirstJsonBlock(configMessage.content);
      if (config?.type === 'wheelBotConfig' && config.guildId === guild.id) {
        return {
          ...config,
          configChannelId: channel.id,
          configMessageId: configMessage.id
        };
      }
    } catch {
      // Ignore channels the bot cannot read.
    }
  }

  return null;
}

const botMember = await interaction.guild.members.fetchMe();

const savedMissing = getMissingChannelPerms(savedChannel, botMember, [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.ReadMessageHistory,
  PermissionFlagsBits.ManageMessages
]);

if (savedMissing.length > 0) {
  await interaction.editReply({
    content:
      `❌ I do not have enough permissions in ${savedChannel}.\n` +
      `Missing: ${savedMissing.join(', ')}`
  });
  return;
}

const spinMissing = getMissingChannelPerms(spinChannel, botMember, [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.ReadMessageHistory,
  PermissionFlagsBits.EmbedLinks,
  PermissionFlagsBits.AttachFiles
]);

if (spinMissing.length > 0) {
  await interaction.editReply({
    content:
      `❌ I do not have enough permissions in ${spinChannel}.\n` +
      `Missing: ${spinMissing.join(', ')}`
  });
  return;
}

async function upsertGuildConfig({
  guild,
  botUserId,
  savedChannel,
  spinChannel,
  managerRoleId
}) {
  const configObject = {
    type: 'wheelBotConfig',
    version: 1,
    guildId: guild.id,
    wheelSpinChannelId: spinChannel.id,
    savedWheelsChannelId: savedChannel.id,
    managerRoleId
  };

  const existing = await getGuildConfig(guild, botUserId);
  const content = renderConfigMessage(configObject);

  if (existing) {
    const existingChannel = await guild.channels.fetch(existing.configChannelId);
    if (!existingChannel || existingChannel.type !== ChannelType.GuildText) {
      throw new Error('Existing config channel could not be loaded.');
    }

    const existingMessage = await existingChannel.messages.fetch(existing.configMessageId);
    if (!existingMessage) {
      throw new Error('Existing config message could not be loaded.');
    }

    if (existingChannel.id !== savedChannel.id) {
      await existingMessage.unpin().catch(() => {});
      await existingMessage.delete().catch(() => {});
      const newMessage = await savedChannel.send({ content });
      await newMessage.pin();
      return newMessage;
    }

    await existingMessage.edit({ content });
    await existingMessage.pin().catch(() => {});
    return existingMessage;
  }

  const newMessage = await savedChannel.send({ content });
  await newMessage.pin();
  return newMessage;
}

function renderConfigMessage(config) {
  return [
    '🔧 Wheel Bot Configuration',
    '',
    CONFIG_MARKER,
    '```json',
    JSON.stringify(config, null, 2),
    '```'
  ].join('\n');
}

function renderWheelRecord(wheel) {
  const entryLines = wheel.entries.map(entry => `- ${entry}`).join('\n');

  return [
    `🎡 Wheel: ${wheel.name}`,
    '',
    `Entries (${wheel.entries.length}):`,
    entryLines,
    '',
    '```json',
    JSON.stringify(wheel, null, 2),
    '```'
  ].join('\n');
}

function extractFirstJsonBlock(content) {
  const match = content.match(/```json\s*([\s\S]*?)\s*```/i);
  if (!match) return null;

  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

async function findWheelMessageByName(savedChannel, botUserId, wheelName) {
  const messages = await savedChannel.messages.fetch({ limit: 100 });

  for (const message of messages.values()) {
    if (message.author.id !== botUserId) continue;
    if (!message.content.includes('"type": "wheel"')) continue;

    const wheel = extractFirstJsonBlock(message.content);
    if (!wheel || wheel.type !== 'wheel') continue;

    if (wheel.name.toLowerCase() === wheelName.toLowerCase()) {
      return message;
    }
  }

  return null;
}
