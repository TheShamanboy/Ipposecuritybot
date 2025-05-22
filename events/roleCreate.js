const { AuditLogEvent } = require('discord.js');
const { getGuildSettings } = require('../utils/database');
const { isWhitelisted } = require('../utils/permissions');
const { log } = require('../utils/logger');

module.exports = {
  name: 'roleCreate',
  async execute(role, client) {
    try {
      const guildId = role.guild.id;
      const guildSettings = getGuildSettings(guildId);

      // Check if anti role create protection is enabled
      if (!guildSettings.antiRoleCreate) return;

      // Get the audit log for this action
      const auditLogs = await role.guild.fetchAuditLogs({
        type: AuditLogEvent.RoleCreate,
        limit: 1
      });

      const auditEntry = auditLogs.entries.first();

      // If no audit log entry found or it's too old (more than 5 seconds), ignore
      if (!auditEntry || (Date.now() - auditEntry.createdTimestamp > 5000)) return;

      const { executor } = auditEntry;

      // Ignore actions from the bot itself or whitelisted users
      if (executor.id === client.user.id || isWhitelisted(guildId, executor.id)) return;

      // Log the action
      log('warn', `Role "${role.name}" created by ${executor.tag} (${executor.id}) in ${role.guild.name} - Taking action`);

      try {
        // Ban the user
        await role.guild.members.ban(executor.id, {
          reason: 'Security Violation: Unauthorized role creation'
        });

        // Delete the created role
        await role.delete('Unauthorized role creation - security measure');

        // Log to security channel if available
        if (guildSettings.securityLogsChannelId) {
          const securityChannel = role.guild.channels.cache.get(guildSettings.securityLogsChannelId);
          if (securityChannel) {
            await securityChannel.send(`🚨 **SECURITY ALERT** 🚨\nUser ${executor.tag} (${executor.id}) was banned for creating role "${role.name}" without permission.`);
          }
        }
      } catch (error) {
        log('error', `Failed to ban user ${executor.tag} (${executor.id}) for role creation: ${error.message}`, error);
        
        // Try to notify in security logs channel
        if (guildSettings.securityLogsChannelId) {
          const securityChannel = role.guild.channels.cache.get(guildSettings.securityLogsChannelId);
          if (securityChannel) {
            await securityChannel.send(`⚠️ **WARNING** ⚠️\nFailed to ban user ${executor.tag} (${executor.id}) for creating role "${role.name}". Please check my permissions.`);
          }
        }
      }
    } catch (error) {
      log('error', `Error in roleCreate event: ${error.message}`, error);
    }
  }
};
