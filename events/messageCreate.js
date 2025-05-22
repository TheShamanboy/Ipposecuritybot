const { log } = require('../utils/logger');
const { getGuildSettings } = require('../utils/database');

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    try {
      // Ignore bot messages and DMs
      if (message.author.bot || !message.guild) return;

      // Check for command prefix
      const prefix = '&&';
      if (!message.content.startsWith(prefix)) return;

      // Parse command and arguments
      const args = message.content.slice(prefix.length).trim().split(/ +/);
      const commandName = args.shift().toLowerCase();

      // Get command from collection
      const command = client.commands.get(commandName);
      if (!command) return;

      // Log command usage
      log('info', `Command executed: ${commandName} by ${message.author.tag} in ${message.guild.name} (${message.guild.id})`);

      try {
        // Execute the command
        await command.execute(message, args, client);
      } catch (error) {
        log('error', `Error executing command ${commandName}: ${error.message}`, error);
        message.reply('An error occurred while executing that command. Please try again later.');
      }
    } catch (error) {
      log('error', `Error in messageCreate event: ${error.message}`, error);
    }
  }
};
