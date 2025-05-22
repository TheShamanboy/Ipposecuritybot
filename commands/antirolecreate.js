const { EmbedBuilder } = require('discord.js');
const { getGuildSettings, updateGuildSettings } = require('../utils/database');
const { checkPermissions } = require('../utils/permissions');
const { log } = require('../utils/logger');

module.exports = {
  name: 'antirolecreate',
  description: 'Toggle anti role create protection',
  async execute(message, args, client) {
    try {
      // Check if user has necessary permissions
      if (!checkPermissions(message, 'SECURITY_ADMIN')) {
        return message.reply('You do not have permission to use this command. Only users with the Security Admin role can use security commands.');
      }

      const guildId = message.guild.id;
      const guildSettings = getGuildSettings(guildId);
      
      // Toggle the setting
      const newValue = !guildSettings.antiRoleCreate;
      updateGuildSettings(guildId, 'antiRoleCreate', newValue);
      
      const statusText = newValue ? 'enabled' : 'disabled';
      const color = newValue ? '#00FF00' : '#FF0000';
      
      const embed = new EmbedBuilder()
        .setTitle('Anti Role Create Protection')
        .setColor(color)
        .setDescription(`Anti role create protection has been ${statusText}.`)
        .addFields(
          { name: 'Status', value: `${newValue ? '✅ Enabled' : '❌ Disabled'}` },
          { name: 'Action', value: 'Users who create roles without permission will be banned.' }
        )
        .setFooter({ text: `Requested by ${message.author.tag}` })
        .setTimestamp();
      
      await message.reply({ embeds: [embed] });
      log('info', `Anti role create protection ${statusText} by ${message.author.tag} in ${message.guild.name}`);
    } catch (error) {
      log('error', `Error executing antirolecreate command: ${error.message}`, error);
      await message.reply('An error occurred while toggling anti role create protection. Please try again later.');
    }
  }
};
