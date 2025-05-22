const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getGuildSettings, updateGuildSettings } = require('../utils/database');
const { checkPermissions } = require('../utils/permissions');
const { log } = require('../utils/logger');

module.exports = {
  name: 'securitytools',
  description: 'Create security logs channel and security role',
  async execute(message, args, client) {
    try {
      // Only server administrators can set up security tools
      if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return message.reply('You need Administrator permission to set up security tools.');
      }

      const guildId = message.guild.id;
      const guildSettings = getGuildSettings(guildId);
      
      // Check if security tools are already set up
      if (guildSettings.securityLogsChannelId && guildSettings.securityRoleId) {
        // Check if the channel and role still exist
        const logsChannel = message.guild.channels.cache.get(guildSettings.securityLogsChannelId);
        const securityRole = message.guild.roles.cache.get(guildSettings.securityRoleId);
        
        if (logsChannel && securityRole) {
          return message.reply(`Security tools are already set up with logs channel ${logsChannel} and security role ${securityRole}. Use \`&&securitytools reset\` to reset them.`);
        }
      }
      
      // If args contain "reset", reset security tools
      if (args.length > 0 && args[0].toLowerCase() === 'reset') {
        updateGuildSettings(guildId, 'securityLogsChannelId', null);
        updateGuildSettings(guildId, 'securityRoleId', null);
        
        const embed = new EmbedBuilder()
          .setTitle('Security Tools Reset')
          .setColor('#FF0000')
          .setDescription('Security tools have been reset. You can set them up again using `&&securitytools`.')
          .setFooter({ text: `Requested by ${message.author.tag}` })
          .setTimestamp();
        
        return message.reply({ embeds: [embed] });
      }
      
      // Create security logs channel
      const logsChannel = await message.guild.channels.create({
        name: 'security-logs',
        type: 0, // Text channel
        topic: 'Security logs for server protection',
        permissionOverwrites: [
          {
            id: message.guild.id, // @everyone role
            deny: [PermissionFlagsBits.ViewChannel]
          }
        ]
      });
      
      // Create security admin role
      const securityRole = await message.guild.roles.create({
        name: 'Security Admin',
        color: '#FF0000',
        permissions: [],
        mentionable: false,
        reason: 'Security role for managing server protection'
      });
      
      // Allow the role to view the logs channel
      await logsChannel.permissionOverwrites.create(securityRole.id, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true
      });
      
      // Update guild settings with new IDs
      updateGuildSettings(guildId, 'securityLogsChannelId', logsChannel.id);
      updateGuildSettings(guildId, 'securityRoleId', securityRole.id);
      
      // Give the command issuer the security role
      await message.member.roles.add(securityRole);
      
      const embed = new EmbedBuilder()
        .setTitle('Security Tools Created')
        .setColor('#00FF00')
        .setDescription('Security tools have been set up successfully!')
        .addFields(
          { name: 'Security Logs Channel', value: `${logsChannel}` },
          { name: 'Security Admin Role', value: `${securityRole}` },
          { name: 'Next Steps', value: 'Assign the Security Admin role to trusted staff who should manage security settings.' }
        )
        .setFooter({ text: `Requested by ${message.author.tag}` })
        .setTimestamp();
      
      // Send a welcome message to the logs channel
      const welcomeEmbed = new EmbedBuilder()
        .setTitle('Security Logs Channel')
        .setColor('#0099FF')
        .setDescription('This channel will display security-related events for your server.')
        .addFields(
          { name: 'Purpose', value: 'Monitor all security events including banned users, role/channel modifications, and system changes.' },
          { name: 'Access', value: 'Only users with the Security Admin role can view this channel.' },
          { name: 'Commands', value: 'Use `&&security help` to see all available security commands.' }
        )
        .setTimestamp();
      
      await logsChannel.send({ embeds: [welcomeEmbed] });
      
      log('info', `Security tools set up by ${message.author.tag} in ${message.guild.name}`);
      return message.reply({ embeds: [embed] });
    } catch (error) {
      log('error', `Error executing securitytools command: ${error.message}`, error);
      await message.reply('An error occurred while setting up security tools. Please check my permissions and try again later.');
    }
  }
};
