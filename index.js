import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();
const token = process.env.DISCORD_TOKEN;
const prefix = '?'; // Define your command prefix here
const color = '#704536'; // Colour of embeds

// --- 1. Command Data Structure (MANDATORY) ---
// Define all commands in a single object for easy lookup and help generation
const commands = {
    help: {
        description: 'Shows this list of available commands, or detailed info for a specific command.',
        usage: `${prefix}help <command>` // Example: ?help echo
    },
    echo: {
        description: 'Repeats the text you type and deletes your original command message (requires bot permission).',
        usage: `${prefix}echo <text>` // Example: ?echo Hello there!
    },
    // Add new commands to this object as you create them!
};
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
    client.user.setActivity('for ' + prefix + 'help', { type: 3 }); // Setting bot status
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
    if (command === 'echo') {
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
});

// Log the bot in
client.login(token);