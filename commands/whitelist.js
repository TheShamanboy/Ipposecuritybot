const { EmbedBuilder } = require('discord.js');
const { getGuildSettings, updateGuildSettings, addToWhitelist, removeFromWhitelist } = require('../utils/database');
const { checkPermissions } = require('../utils/permissions');
const { log } = require('../utils/logger');

module.exports = {
  name: 'whitelist',
  description: 'Manage whitelist for security features',
  async execute(message, args, client) {
    try {
      // Check if user has necessary permissions
      if (!checkPermissions(message, 'SECURITY_ADMIN')) {
        return message.reply('You do not have permission to use this command. Only users with the Security Admin role can use security commands.');
      }

      const guildId = message.guild.id;
      const guildSettings = getGuildSettings(guildId);
      
      // If no arguments, show help
      if (!args.length) {
        return message.reply('Invalid command usage. Please use `&&whitelist add <user>`, `&&whitelist remove <user>`, or `&&whitelist show`.');
      }
      
      const subCommand = args[0].toLowerCase();
      
      // Show whitelist
      if (subCommand === 'show') {
        const whitelist = guildSettings.whitelist || [];
        
        const embed = new EmbedBuilder()
          .setTitle('Security Whitelist')
          .setColor('#0099FF')
          .setDescription('Users in the whitelist are exempt from all security actions.')
          .addFields(
            { 
              name: 'Whitelisted Users', 
              value: whitelist.length > 0 
                ? whitelist.map(id => {
                    const user = client.users.cache.get(id);
                    return user ? `• ${user.tag} (${id})` : `• Unknown User (${id})`;
                  }).join('\n')
                : 'No users have been whitelisted.' 
            }
          )
          .setFooter({ text: `Requested by ${message.author.tag}` })
          .setTimestamp();
        
        return message.reply({ embeds: [embed] });
      }
      
      // Add to whitelist
      if (subCommand === 'add') {
        if (args.length < 2) {
          return message.reply('Please mention a user or provide a user ID to add to the whitelist.');
        }
        
        let userId;
        
        // Check if user is mentioned
        if (message.mentions.users.size > 0) {
          userId = message.mentions.users.first().id;
        } else {
          // Try to parse as user ID
          userId = args[1].replace(/[<@!>]/g, '');
          
          // Validate if it's a real user
          try {
            await client.users.fetch(userId);
          } catch (error) {
            return message.reply('Invalid user ID. Please provide a valid user ID or mention a user.');
          }
        }
        
        // Check if user is already whitelisted
        if (guildSettings.whitelist && guildSettings.whitelist.includes(userId)) {
          return message.reply('This user is already in the whitelist.');
        }
        
        // Add to whitelist
        addToWhitelist(guildId, userId);
        
        const user = client.users.cache.get(userId) || await client.users.fetch(userId);
        
        const embed = new EmbedBuilder()
          .setTitle('User Whitelisted')
          .setColor('#00FF00')
          .setDescription(`${user.tag} has been added to the security whitelist.`)
          .setFooter({ text: `Requested by ${message.author.tag}` })
          .setTimestamp();
        
        log('info', `User ${user.tag} (${userId}) added to whitelist by ${message.author.tag} in ${message.guild.name}`);
        return message.reply({ embeds: [embed] });
      }
      
      // Remove from whitelist
      if (subCommand === 'remove') {
        if (args.length < 2) {
          return message.reply('Please mention a user or provide a user ID to remove from the whitelist.');
        }
        
        let userId;
        
        // Check if user is mentioned
        if (message.mentions.users.size > 0) {
          userId = message.mentions.users.first().id;
        } else {
          // Try to parse as user ID
          userId = args[1].replace(/[<@!>]/g, '');
        }
        
        // Check if user is in the whitelist
        if (!guildSettings.whitelist || !guildSettings.whitelist.includes(userId)) {
          return message.reply('This user is not in the whitelist.');
        }
        
        // Remove from whitelist
        removeFromWhitelist(guildId, userId);
        
        let userName = userId;
        try {
          const user = client.users.cache.get(userId) || await client.users.fetch(userId);
          userName = user.tag;
        } catch (error) {
          // User might not be fetchable, use ID in that case
        }
        
        const embed = new EmbedBuilder()
          .setTitle('User Removed from Whitelist')
          .setColor('#FF0000')
          .setDescription(`${userName} has been removed from the security whitelist.`)
          .setFooter({ text: `Requested by ${message.author.tag}` })
          .setTimestamp();
        
        log('info', `User ${userName} (${userId}) removed from whitelist by ${message.author.tag} in ${message.guild.name}`);
        return message.reply({ embeds: [embed] });
      }
      
      // Invalid subcommand
      return message.reply('Invalid command usage. Please use `&&whitelist add <user>`, `&&whitelist remove <user>`, or `&&whitelist show`.');
      
    } catch (error) {
      log('error', `Error executing whitelist command: ${error.message}`, error);
      await message.reply('An error occurred while managing the whitelist. Please try again later.');
    }
  }
};
