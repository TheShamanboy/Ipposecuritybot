const { PermissionFlagsBits } = require('discord.js');
const { getGuildSettings } = require('./database');
const { log } = require('./logger');

/**
 * Check if a user is whitelisted in a guild
 * @param {string} guildId - The ID of the guild
 * @param {string} userId - The ID of the user to check
 * @returns {boolean} Whether the user is whitelisted
 */
function isWhitelisted(guildId, userId) {
  const guildSettings = getGuildSettings(guildId);
  return guildSettings.whitelist && guildSettings.whitelist.includes(userId);
}

/**
 * Check if a user has the necessary permissions to use security commands
 * @param {Message} message - The message that triggered the command
 * @param {string} permissionType - The type of permission to check
 * @returns {boolean} Whether the user has the necessary permissions
 */
function checkPermissions(message, permissionType) {
  const guildId = message.guild.id;
  const guildSettings = getGuildSettings(guildId);
  
  // Server owners always have permission
  if (message.guild.ownerId === message.author.id) {
    return true;
  }
  
  // Administrators always have permission
  if (message.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return true;
  }
  
  // For security admin commands, check if user has the security role
  if (permissionType === 'SECURITY_ADMIN') {
    if (!guildSettings.securityRoleId) {
      // If security role is not set up, only allow guild owner
      log('warn', `Security role not set up in guild ${message.guild.name}. Only owner can use security commands.`);
      return message.guild.ownerId === message.author.id;
    }
    
    // Check if user has the security role
    return message.member.roles.cache.has(guildSettings.securityRoleId);
  }
  
  // Default to false for unknown permission types
  return false;
}

module.exports = {
  isWhitelisted,
  checkPermissions
};
