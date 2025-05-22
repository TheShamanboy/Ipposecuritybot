const { AuditLogEvent } = require('discord.js');
const { getGuildSettings } = require('../utils/database');
const { isWhitelisted } = require('../utils/permissions');
const { log } = require('../utils/logger');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member, client) {
    try {
      // Check if the new member is a bot
      if (!member.user.bot) return;
      
      const guildId = member.guild.id;
      const guildSettings = getGuildSettings(guildId);

      // Check if anti bot add protection is enabled
      if (!guildSettings.antiBotAdd) return;

      // Get the audit log for this action
      const auditLogs = await member.guild.fetchAuditLogs({
        type: AuditLogEvent.BotAdd,
        limit: 1
      });

      const auditEntry = auditLogs.entries.first();

      // If no audit log entry found or it's too old (more than 5 seconds), ignore
      if (!auditEntry || (Date.now() - auditEntry.createdTimestamp > 5000)) return;

      const { executor } = auditEntry;

      // Ignore actions from the bot itself or whitelisted users
      if (executor.id === client.user.id || isWhitelisted(guildId, executor.id)) return;

      // Log the action
      log('warn', `Bot "${member.user.tag}" added by ${executor.tag} (${executor.id}) in ${member.guild.name} - Taking action`);

      try {
        // Kick the bot
        await member.kick('Security Violation: Unauthorized bot addition');
        
        // Ban the user who added the bot
        await member.guild.members.ban(executor.id, {
          reason: 'Security Violation: Unauthorized bot addition'
        });

        // Log to security channel if available
        if (guildSettings.securityLogsChannelId) {
          const securityChannel = member.guild.channels.cache.get(guildSettings.securityLogsChannelId);
          if (securityChannel) {
            await securityChannel.send(`🚨 **SECURITY ALERT** 🚨\nUser ${executor.tag} (${executor.id}) was banned for adding bot "${member.user.tag}" without permission. The bot has been kicked.`);
          }
        }
      } catch (error) {
        log('error', `Failed to act on unauthorized bot addition: ${error.message}`, error);
        
        // Try to notify in security logs channel
        if (guildSettings.securityLogsChannelId) {
          const securityChannel = member.guild.channels.cache.get(guildSettings.securityLogsChannelId);
          if (securityChannel) {
            await securityChannel.send(`⚠️ **WARNING** ⚠️\nFailed to ban user ${executor.tag} (${executor.id}) for adding bot "${member.user.tag}". Please check my permissions.`);
          }
        }
      }
    } catch (error) {
      log('error', `Error in guildMemberAdd event: ${error.message}`, error);
    }
  }
};
