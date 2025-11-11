import { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField } from 'discord.js';
import * as dotenv from 'dotenv';
import express from 'express';

// Load environment variables from .env file
dotenv.config();
const token = process.env.DISCORD_TOKEN;
const prefix = '?'; // Define your command prefix here
const color = '#704536'; // Colour of embeds
// ---= ROLE IDS ---
const MOD_ROLE_ID = '1437398624785928252';
const OWNER_ROLE_ID = '1277220062909960253';
// ---------------------------

// --- 1. Command Data Structure (MANDATORY) ---
// Define all commands in a single object for easy lookup and help generation

// ----------------------------------------
// --- Misc Commands ---

const commands = {
    help: {
        description: 'Fetches sonic feet rule 34',
        usage: `${prefix}help <command>` // Example: ?help echo
    },
    echo: {
        description: 'Repeats your message',
        usage: `${prefix}echo <text>` // Example: ?echo Hello there!
    },

// --- Misc Commands ---
// ----------------------------------------
// --- Moderation Commands ---

    kick: {
        description: 'Kicks a member from the server',
        usage: `${prefix}kick @user <reason>`
    },
    ban: {
        description: 'Bans a member from the server',
        usage: `${prefix}ban @user <reason>`
    },
    timeout: {
        description: 'Times out a member',
        usage: `${prefix}timeout @user <minutes> <reason>`
    }

// --- Moderation Commands ---
// ----------------------------------------
};

// ----------------------------------------
// ----------------------------------------

// Create a new client instance with necessary intents
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ] 
});

// --- Bot is Ready ---
client.on('ready', () => {
    console.log(`✅ Logged in as ${client.user.tag}!`);
    client.user.setActivity('67', { type: 3 }); // Setting bot status
});

// --- Command Handling (messageCreate Listener) ---
client.on('messageCreate', async message => {
    // Ignore messages sent by the bot itself and DMs
    if (message.author.bot || message.channel.type === 'dm') return;

    // Check if the message starts with the defined prefix
    if (!message.content.startsWith(prefix)) return;

    // Get the command and arguments (e.g., "?echo Hello" -> command="echo", args=["Hello"])
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // --- 1. Echo Command Logic ---
    if (command === 'echo' || commmand === 'e') {
        const textToEcho = args.join(' ').trim();

        if (textToEcho) {
            // Check if the bot has permission to delete messages
            if (message.channel.permissionsFor(client.user).has('ManageMessages')) {
                // Delete the original command message
                try {
                    await message.delete();
                } catch (error) {
                    console.error('Failed to delete message:', error);
                }
            } else {
                console.warn(`Bot lacks 'MANAGE_MESSAGES' permission in channel: ${message.channel.name}`);
            }

            // Send the echoed message
            message.channel.send(textToEcho);
        } else {
            // Respond if no text is provided (This is where the 'sybau' change was applied)
            message.reply(`sybau`);
        }
    }

    // --- 2. Help Command Logic (Fixed Structure) ---
    if (command === 'help') {
        const commandName = args[0] ? args[0].toLowerCase() : null;

        if (commandName && commands[commandName]) {
            // Case 1: Specific command help requested (?help echo)
            const cmd = commands[commandName];
            const specificHelpEmbed = new EmbedBuilder()
                .setColor(color) // Use the defined color variable
                .setTitle(`Command: ${prefix}${commandName}`)
                .setDescription(cmd.description)
                .addFields(
                    { name: 'Usage', value: `\`${cmd.usage}\``, inline: false }
                )
                .setFooter({ text: `Type ${prefix}help for a list of all commands.` });
            
            message.channel.send({ embeds: [specificHelpEmbed] });
            
        } else {
            // Case 3: General help requested (?help)
            const helpEmbed = new EmbedBuilder()
                .setColor(color) // Use the defined color variable
                .setTitle('Help Menu')
                .setDescription(`comand`)
                .addFields(
                    // Dynamically build fields from the commands object
                    Object.keys(commands).map(key => ({
                        name: `${prefix}${key}`,
                        value: commands[key].description,
                        inline: false
                    }))
                )

            message.channel.send({ embeds: [helpEmbed] });
        }
    }

    // --- 3. KICK COMMAND ---
    if (command === 'kick') {
        // --- 1. EXECUTOR PERMISSION CHECK (CUSTOM) ---
        // Check if the user is an Owner OR a Mod
        const canExecutorUseCommand = message.member.roles.cache.has(OWNER_ROLE_ID) || message.member.roles.cache.has(MOD_ROLE_ID);
        if (!canExecutorUseCommand) {
            return message.reply("You do not have permission to use this command.");
        }

        // --- 2. GET TARGET USER ---
        const target = message.mentions.members.first();
        if (!target) {
            return message.reply(`You must specify a user to kick. Usage: \`${commands.kick.usage}\``);
        }

        // --- 3. HIERARCHY CHECK (CUSTOM ROLES) ---
        const executorIsOwner = message.member.roles.cache.has(OWNER_ROLE_ID);
        const targetIsMod = target.roles.cache.has(MOD_ROLE_ID);
        const targetIsOwner = target.roles.cache.has(OWNER_ROLE_ID);

        // Stop if the target is an Owner (Owners are immune)
        if (targetIsOwner) {
            return message.reply("try that again and see what happens...");
        }

        // Stop if the target is a Mod AND the executor is NOT an Owner (Mods can't kick other Mods)
        if (targetIsMod && !executorIsOwner) {
            return message.reply("nice try buddy");
        }

        // --- 4. BOT PERMISSION CHECK (DISCORD API) ---
        // This is still required. The bot's role must be high enough in Discord's hierarchy.
        if (!target.kickable) {
            return message.reply("I am missing permissions");
        }

        // --- 5. EXECUTE KICK ---
        const reason = args.slice(1).join(' ').trim() || 'No reason provided';
        try {
            await target.kick(reason);
            const kickEmbed = new EmbedBuilder()
                .setColor(color)
                .setTitle('Member Kicked')
                .addFields(
                    { name: 'User', value: target.user.tag, inline: true },
                    { name: 'Kicked by', value: message.author.tag, inline: true },
                    { name: 'Reason', value: reason, inline: false }
                )
                .setTimestamp();
            message.channel.send({ embeds: [kickEmbed] });
        } catch (error) {
            console.error(error);
            message.reply('An error occurred while trying to kick this member.');
        }
    }

    // --- 4. BAN COMMAND ---
    if (command === 'ban') {
        // --- 1. EXECUTOR PERMISSION CHECK (CUSTOM) ---
        const canExecutorUseCommand = message.member.roles.cache.has(OWNER_ROLE_ID) || message.member.roles.cache.has(MOD_ROLE_ID);
        if (!canExecutorUseCommand) {
            return message.reply("You do not have permission to use this command.");
        }

        // --- 2. GET TARGET USER ---
        const target = message.mentions.members.first();
        if (!target) {
            return message.reply(`You must specify a user to ban. Usage: \`${commands.ban.usage}\``);
        }

        // --- 3. HIERARCHY CHECK (CUSTOM ROLES) ---
        const executorIsOwner = message.member.roles.cache.has(OWNER_ROLE_ID);
        const targetIsMod = target.roles.cache.has(MOD_ROLE_ID);
        const targetIsOwner = target.roles.cache.has(OWNER_ROLE_ID);

        if (targetIsOwner) {
            return message.reply("try that again and see what happens...");
        }
        if (targetIsMod && !executorIsOwner) {
            return message.reply("nice try buddy");
        }

        // --- 4. BOT PERMISSION CHECK (DISCORD API) ---
        if (!target.bannable) {
            return message.reply("I am missing permissions");
        }

        // --- 5. EXECUTE BAN ---
        const reason = args.slice(1).join(' ').trim() || 'No reason provided';
        try {
            await target.ban({ reason: reason });
            const banEmbed = new EmbedBuilder()
                .setColor(color)
                .setTitle('Member Kicked')
                .addFields(
                    { name: 'User', value: target.user.tag, inline: true },
                    { name: 'Banned by', value: message.author.tag, inline: true },
                    { name: 'Reason', value: reason, inline: false }
                )
                .setTimestamp();
            message.channel.send({ embeds: [banEmbed] });
        } catch (error) {
            console.error(error);
            message.reply('An error occurred while trying to ban this member.');
        }
    }

    // --- 5. TIMEOUT COMMAND ---
    if (command === 'timeout' || command === 'mute') {
        // --- 1. EXECUTOR PERMISSION CHECK (CUSTOM) ---
        const canExecutorUseCommand = message.member.roles.cache.has(OWNER_ROLE_ID) || message.member.roles.cache.has(MOD_ROLE_ID);
        if (!canExecutorUseCommand) {
            return message.reply("You do not have permission to use this command.");
        }

        // --- 2. GET TARGET USER ---
        const target = message.mentions.members.first();
        if (!target) {
            return message.reply(`You must specify a user. Usage: \`${commands.timeout.usage}\``);
        }

        // --- 3. HIERARCHY CHECK (CUSTOM ROLES) ---
        const executorIsOwner = message.member.roles.cache.has(OWNER_ROLE_ID);
        const targetIsMod = target.roles.cache.has(MOD_ROLE_ID);
        const targetIsOwner = target.roles.cache.has(OWNER_ROLE_ID);

        if (targetIsOwner) {
            return message.reply("try that again and see what happens...");
        }
        if (targetIsMod && !executorIsOwner) {
            return message.reply("nice try buddy");
        }

        // --- 4. GET DURATION & REASON ---
        const durationMinutes = parseInt(args[1]);
        if (isNaN(durationMinutes) || durationMinutes <= 0) {
            return message.reply(`You must provide a valid duration in *minutes*. Usage: \`${commands.timeout.usage}\``);
        }
        const durationMs = durationMinutes * 60 * 1000;
        const maxTimeoutMs = 28 * 24 * 60 * 60 * 1000; // 28 days
        if (durationMs > maxTimeoutMs) {
            return message.reply('The maximum timeout duration is 28 days.');
        }
        const reason = args.slice(2).join(' ').trim() || 'No reason provided';

        // --- 5. BOT PERMISSION CHECK (DISCORD API) ---
        if (!target.moderatable) {
            return message.reply("I am missing permissions");
        }

        // --- 6. EXECUTE TIMEOUT ---
        try {
            await target.timeout(durationMs, reason);
            const timeoutEmbed = new EmbedBuilder()
                .setColor(color)
                .setTitle('Member Timed Out')
                .addFields(
                    { name: 'User', value: target.user.tag, inline: true },
                    { name: 'Duration', value: `${durationMinutes} minute(s)`, inline: true },
                    { name: 'Timed out by', value: message.author.tag, inline: false },
                    { name: 'Reason', value: reason, inline: false }
                )
                .setTimestamp();
            message.channel.send({ embeds: [timeoutEmbed] });
        } catch (error) {
            console.error(error);
            message.reply('An error occurred while trying to time out this member.');
        }
    }
});

// --- KEEPALIVE WEB SERVER (REQUIRED FOR RENDER) ---
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Edgetron Bot is alive!');
});

app.listen(port, () => {
    console.log(`🌐 Keep-alive server listening on port ${port}`);
});
// --------------------------------------------------

// Log the bot in

client.login(token);
