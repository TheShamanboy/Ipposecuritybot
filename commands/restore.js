const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getGuildSettings, getDeletedItems } = require('../utils/database');
const { checkPermissions } = require('../utils/permissions');
const { log } = require('../utils/logger');

module.exports = {
  name: 'restore',
  description: 'Restore deleted channels or roles',
  async execute(message, args, client) {
    try {
      // Check if user has necessary permissions
      if (!checkPermissions(message, 'SECURITY_ADMIN')) {
        return message.reply('You do not have permission to use this command. Only users with the Security Admin role can use security commands.');
      }

      const guildId = message.guild.id;
      const deletedItems = getDeletedItems(guildId);
      
      if (!deletedItems || (deletedItems.channels.length === 0 && deletedItems.roles.length === 0)) {
        return message.reply('There are no deleted channels or roles to restore.');
      }
      
      // If no arguments provided, show list of deleted items
      if (!args.length) {
        const embed = new EmbedBuilder()
          .setTitle('Restore Deleted Items')
          .setColor('#0099FF')
          .setDescription('Use `&&restore channels` to restore deleted channels or `&&restore roles` to restore deleted roles.')
          .addFields(
            { 
              name: 'Deleted Channels', 
              value: deletedItems.channels.length > 0 
                ? deletedItems.channels.map(c => `• ${c.name} (${c.type})`).join('\n')
                : 'No deleted channels found.' 
            },
            { 
              name: 'Deleted Roles', 
              value: deletedItems.roles.length > 0 
                ? deletedItems.roles.map(r => `• ${r.name} (Color: ${r.color})`).join('\n')
                : 'No deleted roles found.' 
            }
          )
          .setFooter({ text: `Requested by ${message.author.tag}` })
          .setTimestamp();
        
        return message.reply({ embeds: [embed] });
      }
      
      // Handle restoring channels
      if (args[0].toLowerCase() === 'channels') {
        if (deletedItems.channels.length === 0) {
          return message.reply('There are no deleted channels to restore.');
        }
        
        let restored = 0;
        for (const channel of deletedItems.channels) {
          try {
            await message.guild.channels.create({
              name: channel.name,
              type: channel.type,
              topic: channel.topic,
              permissionOverwrites: channel.permissionOverwrites || [],
              parent: channel.parentId ? message.guild.channels.cache.get(channel.parentId) : null
            });
            restored++;
          } catch (err) {
            log('error', `Failed to restore channel ${channel.name}: ${err.message}`, err);
          }
        }
        
        // Clear the deleted channels
        deletedItems.channels = [];
        
        const embed = new EmbedBuilder()
          .setTitle('Channels Restored')
          .setColor('#00FF00')
          .setDescription(`Successfully restored ${restored} channel(s).`)
          .setFooter({ text: `Requested by ${message.author.tag}` })
          .setTimestamp();
        
        return message.reply({ embeds: [embed] });
      }
      
      // Handle restoring roles
      if (args[0].toLowerCase() === 'roles') {
        if (deletedItems.roles.length === 0) {
          return message.reply('There are no deleted roles to restore.');
        }
        
        let restored = 0;
        for (const role of deletedItems.roles) {
          try {
            await message.guild.roles.create({
              name: role.name,
              color: role.color,
              hoist: role.hoist,
              position: role.position,
              permissions: role.permissions,
              mentionable: role.mentionable
            });
            restored++;
          } catch (err) {
            log('error', `Failed to restore role ${role.name}: ${err.message}`, err);
          }
        }
        
        // Clear the deleted roles
        deletedItems.roles = [];
        
        const embed = new EmbedBuilder()
          .setTitle('Roles Restored')
          .setColor('#00FF00')
          .setDescription(`Successfully restored ${restored} role(s).`)
          .setFooter({ text: `Requested by ${message.author.tag}` })
          .setTimestamp();
        
        return message.reply({ embeds: [embed] });
      }
      
      // If invalid argument provided
      return message.reply('Invalid argument. Use `&&restore channels` to restore channels or `&&restore roles` to restore roles.');
      
    } catch (error) {
      log('error', `Error executing restore command: ${error.message}`, error);
      await message.reply('An error occurred while restoring deleted items. Please try again later.');
    }
  }
};
