const { EmbedBuilder } = require('discord.js');
const { getGuildSettings, updateGuildSettings } = require('../utils/database');
const { checkPermissions } = require('../utils/permissions');
const { log } = require('../utils/logger');

module.exports = {
  name: 'antirole',
  description: 'Toggle anti role delete protection',
  async execute(message, args, client) {
    try {
      // Check if user has necessary permissions
      if (!checkPermissions(message, 'SECURITY_ADMIN')) {
        return message.reply('You do not have permission to use this command. Only users with the Security Admin role can use security commands.');
      }

      // Check if the "delete" argument is provided
      if (!args.length || args[0].toLowerCase() !== 'delete') {
        return message.reply('Invalid command usage. Please use `&&antirole delete` to toggle anti role delete protection.');
      }

      const guildId = message.guild.id;
      const guildSettings = getGuildSettings(guildId);
      
      // Toggle the setting
      const newValue = !guildSettings.antiRoleDelete;
      updateGuildSettings(guildId, 'antiRoleDelete', newValue);
      
      const statusText = newValue ? 'enabled' : 'disabled';
      const color = newValue ? '#00FF00' : '#FF0000';
      
      const embed = new EmbedBuilder()
        .setTitle('Anti Role Delete Protection')
        .setColor(color)
        .setDescription(`Anti role delete protection has been ${statusText}.`)
        .addFields(
          { name: 'Status', value: `${newValue ? '✅ Enabled' : '❌ Disabled'}` },
          { name: 'Action', value: 'Users who delete roles without permission will be banned.' }
        )
        .setFooter({ text: `Requested by ${message.author.tag}` })
        .setTimestamp();
      
      await message.reply({ embeds: [embed] });
      log('info', `Anti role delete protection ${statusText} by ${message.author.tag} in ${message.guild.name}`);
    } catch (error) {
      log('error', `Error executing antirole command: ${error.message}`, error);
      await message.reply('An error occurred while toggling anti role delete protection. Please try again later.');
    }
  }
};
