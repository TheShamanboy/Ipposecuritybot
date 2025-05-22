const { EmbedBuilder } = require('discord.js');
const { checkPermissions } = require('../utils/permissions');
const { log } = require('../utils/logger');

module.exports = {
  name: 'security',
  description: 'Shows security help dashboard with all commands',
  async execute(message, args, client) {
    try {
      const embed = new EmbedBuilder()
        .setTitle('🛡️ Security Bot - Command Dashboard')
        .setColor('#FF0000')
        .setDescription('Below is a list of all available security commands.')
        .addFields(
          { name: '```&&security help```', value: 'Displays this dashboard with all commands.' },
          { name: '```&&antirolecreate```', value: 'Ban users who create roles without permission.' },
          { name: '```&&antirole delete```', value: 'Ban users who delete roles without permission.' },
          { name: '```&&antichannelcreate```', value: 'Ban users who create channels without permission.' },
          { name: '```&&antichannel delete```', value: 'Ban users who delete channels without permission.' },
          { name: '```&&antibot add```', value: 'Ban users who add bots without permission.' },
          { name: '```&&antiwebhook create```', value: 'Ban users who create webhooks without permission.' },
          { name: '```&&antinuke```', value: 'Enable/disable all anti-nuke protections.' },
          { name: '```&&restore```', value: 'Restore deleted channels or roles.' },
          { name: '```&&whitelist add <user>```', value: 'Add a user to the whitelist.' },
          { name: '```&&whitelist remove <user>```', value: 'Remove a user from the whitelist.' },
          { name: '```&&whitelist show```', value: 'Display all whitelisted users.' },
          { name: '```&&securitytools```', value: 'Create security logs channel and security role.' }
        )
        .setFooter({ text: 'Security Bot | Prefix: &&' })
        .setTimestamp();

      await message.reply({ embeds: [embed] });
      log('info', `Security help command executed by ${message.author.tag} in ${message.guild.name}`);
    } catch (error) {
      log('error', `Error executing security help command: ${error.message}`, error);
      await message.reply('An error occurred while displaying the security dashboard. Please try again later.');
    }
  }
};
