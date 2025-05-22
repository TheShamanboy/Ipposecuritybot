const { AuditLogEvent } = require('discord.js');
const { getGuildSettings } = require('../utils/database');
const { isWhitelisted } = require('../utils/permissions');
const { log } = require('../utils/logger');

module.exports = {
  name: 'webhooksUpdate',
  async execute(channel, client) {
    try {
      const guildId = channel.guild.id;
      const guildSettings = getGuildSettings(guildId);

      // Check if anti webhook create protection is enabled
      if (!guildSettings.antiWebhookCreate) return;

      // Get the audit log for this action
      const auditLogs = await channel.guild.fetchAuditLogs({
        type: AuditLogEvent.WebhookCreate,
        limit: 1
      });

      const auditEntry = auditLogs.entries.first();

      // If no audit log entry found or it's too old (more than 5 seconds), ignore
      if (!auditEntry || (Date.now() - auditEntry.createdTimestamp > 5000)) return;

      const { executor, target } = auditEntry;

      // Ignore actions from the bot itself or whitelisted users
      if (executor.id === client.user.id || isWhitelisted(guildId, executor.id)) return;

      // Log the action
      log('warn', `Webhook "${target.name}" created by ${executor.tag} (${executor.id}) in ${channel.guild.name} - Taking action`);

      try {
        // Delete the webhook
        const webhooks = await channel.fetchWebhooks();
        const webhook = webhooks.find(wh => wh.id === target.id);
        if (webhook) {
          await webhook.delete('Security Violation: Unauthorized webhook creation');
        }
        
        // Ban the user
        await channel.guild.members.ban(executor.id, {
          reason: 'Security Violation: Unauthorized webhook creation'
        });

        // Log to security channel if available
        if (guildSettings.securityLogsChannelId) {
          const securityChannel = channel.guild.channels.cache.get(guildSettings.securityLogsChannelId);
          if (securityChannel) {
            await securityChannel.send(`🚨 **SECURITY ALERT** 🚨\nUser ${executor.tag} (${executor.id}) was banned for creating webhook "${target.name}" without permission. The webhook has been deleted.`);
          }
        }
      } catch (error) {
        log('error', `Failed to ban user ${executor.tag} (${executor.id}) for webhook creation: ${error.message}`, error);
        
        // Try to notify in security logs channel
        if (guildSettings.securityLogsChannelId) {
          const securityChannel = channel.guild.channels.cache.get(guildSettings.securityLogsChannelId);
          if (securityChannel) {
            await securityChannel.send(`⚠️ **WARNING** ⚠️\nFailed to ban user ${executor.tag} (${executor.id}) for creating webhook "${target.name}". Please check my permissions.`);
          }
        }
      }
    } catch (error) {
      log('error', `Error in webhooksUpdate event: ${error.message}`, error);
    }
  }
};
