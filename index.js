const { 
    Client, 
    GatewayIntentBits, 
    SlashCommandBuilder, 
    REST, 
    Routes,
    PermissionFlagsBits
} = require('discord.js');

const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');

require('dotenv').config();
const TOKEN = process.env.TOKEN;
const CLIENT_ID = '1473016371724943401';
const GUILD_ID = '1220728870710546484';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates
    ]
});

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag} ✅`);
});

const commands = [

    new SlashCommandBuilder()
        .setName('join')
        .setDescription('Join your voice channel'),

    new SlashCommandBuilder()
        .setName('leave')
        .setDescription('Leave the voice channel'),

    new SlashCommandBuilder()
        .setName('move')
        .setDescription('Move bot to your voice channel'),

    new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Delete messages')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Number of messages (1-100)')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Timeout a user')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('User to timeout')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('minutes')
                .setDescription('Duration in minutes')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a user')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('User to kick')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)

].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    try {
        console.log('Registering slash commands...');
        await rest.put(
            Routes.applicationGuildCommands('1473016371724943401', '1220728870710546484'),
            { body: commands }
        );
        console.log('Slash commands registered ✅');
    } catch (error) {
        console.error(error);
    }
})();

client.on('interactionCreate', async (interaction) => {

    if (!interaction.isChatInputCommand()) return;

    // ===== VOICE COMMANDS =====

    if (interaction.commandName === 'join') {

        const channel = interaction.member.voice.channel;

        if (!channel) {
            await interaction.reply('Join a voice channel first.');
            return;
        }

        joinVoiceChannel({
            channelId: channel.id,
            guildId: interaction.guild.id,
            adapterCreator: interaction.guild.voiceAdapterCreator,
        });

        await interaction.reply('Joined ✅');
    }

    if (interaction.commandName === 'leave') {

        const connection = getVoiceConnection(interaction.guild.id);

        if (connection) {
            connection.destroy();
            await interaction.reply('Left voice channel ✅');
        } else {
            await interaction.reply('I am not in a voice channel.');
        }
    }

    if (interaction.commandName === 'move') {

        const channel = interaction.member.voice.channel;

        if (!channel) {
            await interaction.reply('Join a voice channel first.');
            return;
        }

        joinVoiceChannel({
            channelId: channel.id,
            guildId: interaction.guild.id,
            adapterCreator: interaction.guild.voiceAdapterCreator,
        });

        await interaction.reply('Moved to your channel ✅');
    }

    // ===== MODERATION =====

    if (interaction.commandName === 'clear') {

        const amount = interaction.options.getInteger('amount');

        if (amount < 1 || amount > 100) {
            await interaction.reply('Enter a number between 1 and 100.');
            return;
        }

        await interaction.channel.bulkDelete(amount, true);

        await interaction.reply(`Deleted ${amount} messages ✅`);
    }

    if (interaction.commandName === 'timeout') {

        const user = interaction.options.getUser('target');
        const minutes = interaction.options.getInteger('minutes');

        const member = await interaction.guild.members.fetch(user.id);

        const duration = minutes * 60 * 1000;

        await member.timeout(duration);

        await interaction.reply(`${user.tag} timed out for ${minutes} minutes ⏳`);
    }

    if (interaction.commandName === 'kick') {

        const user = interaction.options.getUser('target');
        const member = await interaction.guild.members.fetch(user.id);

        await member.kick();

        await interaction.reply(`${user.tag} has been kicked 👢`);
    }
});

client.login(TOKEN);

process.on('uncaughtException', (err) => {
    console.log('CRASH ERROR:', err);
});