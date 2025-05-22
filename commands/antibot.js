const { EmbedBuilder } = require('discord.js');
const { getGuildSettings, updateGuildSettings } = require('../utils/database');
const { checkPermissions } = require('../utils/permissions');
const { log } = require('../utils/logger');

module.exports = {
  name: 'antibot',
  description: 'Toggle anti bot add protection',
  async execute(message, args, client) {
    try {
      // Check if user has necessary permissions
      if (!checkPermissions(message, 'SECURITY_ADMIN')) {
        return message.reply('You do not have permission to use this command. Only users with the Security Admin role can use security commands.');
      }

      // Check if the "add" argument is provided
      if (!args.length || args[0].toLowerCase() !== 'add') {
        return message.reply('Invalid command usage. Please use `&&antibot add` to toggle anti bot add protection.');
      }

      const guildId = message.guild.id;
      const guildSettings = getGuildSettings(guildId);
      
      // Toggle the setting
      const newValue = !guildSettings.antiBotAdd;
      updateGuildSettings(guildId, 'antiBotAdd', newValue);
      
      const statusText = newValue ? 'enabled' : 'disabled';
      const color = newValue ? '#00FF00' : '#FF0000';
      
      const embed = new EmbedBuilder()
        .setTitle('Anti Bot Add Protection')
        .setColor(color)
        .setDescription(`Anti bot add protection has been ${statusText}.`)
        .addFields(
          { name: 'Status', value: `${newValue ? '✅ Enabled' : '❌ Disabled'}` },
          { name: 'Action', value: 'Users who add bots without permission will be banned.' }
        )
        .setFooter({ text: `Requested by ${message.author.tag}` })
        .setTimestamp();
      
      await message.reply({ embeds: [embed] });
      log('info', `Anti bot add protection ${statusText} by ${message.author.tag} in ${message.guild.name}`);
    } catch (error) {
      log('error', `Error executing antibot command: ${error.message}`, error);
      await message.reply('An error occurred while toggling anti bot add protection. Please try again later.');
    }
  }
};
