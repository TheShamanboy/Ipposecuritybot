const { AuditLogEvent } = require('discord.js');
const { getGuildSettings, addDeletedItem } = require('../utils/database');
const { isWhitelisted } = require('../utils/permissions');
const { log } = require('../utils/logger');

module.exports = {
  name: 'channelDelete',
  async execute(channel, client) {
    try {
      // Ignore DM channels
      if (!channel.guild) return;

      const guildId = channel.guild.id;
      const guildSettings = getGuildSettings(guildId);

      // Store the deleted channel's data for potential restoration
      const channelData = {
        name: channel.name,
        type: channel.type,
        topic: channel.topic,
        parentId: channel.parentId,
        position: channel.position,
        permissionOverwrites: channel.permissionOverwrites?.cache.map(overwrite => ({
          id: overwrite.id,
          type: overwrite.type,
          allow: overwrite.allow.toArray(),
          deny: overwrite.deny.toArray()
        }))
      };

      addDeletedItem(guildId, 'channel', channelData);

      // Check if anti channel delete protection is enabled
      if (!guildSettings.antiChannelDelete) return;

      // Get the audit log for this action
      const auditLogs = await channel.guild.fetchAuditLogs({
        type: AuditLogEvent.ChannelDelete,
        limit: 1
      });

      const auditEntry = auditLogs.entries.first();

      // If no audit log entry found or it's too old (more than 5 seconds), ignore
      if (!auditEntry || (Date.now() - auditEntry.createdTimestamp > 5000)) return;

      const { executor } = auditEntry;

      // Ignore actions from the bot itself or whitelisted users
      if (executor.id === client.user.id || isWhitelisted(guildId, executor.id)) return;

      // Log the action
      log('warn', `Channel "${channel.name}" deleted by ${executor.tag} (${executor.id}) in ${channel.guild.name} - Taking action`);

      try {
        // Ban the user
        await channel.guild.members.ban(executor.id, {
          reason: 'Security Violation: Unauthorized channel deletion'
        });

        // Log to security channel if available
        if (guildSettings.securityLogsChannelId) {
          const securityChannel = channel.guild.channels.cache.get(guildSettings.securityLogsChannelId);
          if (securityChannel) {
            await securityChannel.send(`🚨 **SECURITY ALERT** 🚨\nUser ${executor.tag} (${executor.id}) was banned for deleting channel "${channel.name}" without permission.`);
          }
        }
      } catch (error) {
        log('error', `Failed to ban user ${executor.tag} (${executor.id}) for channel deletion: ${error.message}`, error);
        
        // Try to notify in security logs channel
        if (guildSettings.securityLogsChannelId) {
          const securityChannel = channel.guild.channels.cache.get(guildSettings.securityLogsChannelId);
          if (securityChannel) {
            await securityChannel.send(`⚠️ **WARNING** ⚠️\nFailed to ban user ${executor.tag} (${executor.id}) for deleting channel "${channel.name}". Please check my permissions.`);
          }
        }
      }
    } catch (error) {
      log('error', `Error in channelDelete event: ${error.message}`, error);
    }
  }
};
