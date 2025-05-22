const { EmbedBuilder } = require('discord.js');
const { getGuildSettings, updateGuildSettings } = require('../utils/database');
const { checkPermissions } = require('../utils/permissions');
const { log } = require('../utils/logger');

module.exports = {
  name: 'antinuke',
  description: 'Toggle all anti-nuke protections',
  async execute(message, args, client) {
    try {
      // Check if user has necessary permissions
      if (!checkPermissions(message, 'SECURITY_ADMIN')) {
        return message.reply('You do not have permission to use this command. Only users with the Security Admin role can use security commands.');
      }

      const guildId = message.guild.id;
      const guildSettings = getGuildSettings(guildId);
      
      // Toggle all security settings
      const currentState = guildSettings.antiNuke;
      const newValue = !currentState;
      
      // Update all security settings at once
      updateGuildSettings(guildId, 'antiNuke', newValue);
      updateGuildSettings(guildId, 'antiRoleCreate', newValue);
      updateGuildSettings(guildId, 'antiRoleDelete', newValue);
      updateGuildSettings(guildId, 'antiChannelCreate', newValue);
      updateGuildSettings(guildId, 'antiChannelDelete', newValue);
      updateGuildSettings(guildId, 'antiBotAdd', newValue);
      updateGuildSettings(guildId, 'antiWebhookCreate', newValue);
      
      const statusText = newValue ? 'enabled' : 'disabled';
      const color = newValue ? '#00FF00' : '#FF0000';
      
      const embed = new EmbedBuilder()
        .setTitle('🛡️ Anti-Nuke Protection')
        .setColor(color)
        .setDescription(`All anti-nuke protections have been ${statusText}.`)
        .addFields(
          { name: 'Status', value: `${newValue ? '✅ Enabled' : '❌ Disabled'}` },
          { name: 'Protections Included', value: 
            '• Anti Role Create\n' +
            '• Anti Role Delete\n' +
            '• Anti Channel Create\n' +
            '• Anti Channel Delete\n' +
            '• Anti Bot Add\n' +
            '• Anti Webhook Create'
          },
          { name: 'Action', value: 'Users who perform potentially harmful actions without permission will be banned.' }
        )
        .setFooter({ text: `Requested by ${message.author.tag}` })
        .setTimestamp();
      
      await message.reply({ embeds: [embed] });
      log('info', `All anti-nuke protections ${statusText} by ${message.author.tag} in ${message.guild.name}`);
    } catch (error) {
      log('error', `Error executing antinuke command: ${error.message}`, error);
      await message.reply('An error occurred while toggling anti-nuke protections. Please try again later.');
    }
  }
};
