const fs = require('fs');
const path = require('path');
const { log } = require('../utils/logger');

/**
 * Loads all command files from the commands directory
 * @param {Client} client - The Discord.js client
 */
async function loadCommands(client) {
  const commandsPath = path.join(__dirname, '../commands');
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  
  log('info', `Loading ${commandFiles.length} commands...`);
  
  for (const file of commandFiles) {
    try {
      const filePath = path.join(commandsPath, file);
      const command = require(filePath);
      
      if (!command.name || !command.execute) {
        log('warn', `The command at ${filePath} is missing a required "name" or "execute" property`);
        continue;
      }
      
      client.commands.set(command.name, command);
      log('info', `Loaded command: ${command.name}`);
    } catch (error) {
      log('error', `Error loading command file ${file}: ${error.message}`);
    }
  }
  
  log('info', `Successfully loaded ${client.commands.size} commands`);
}

module.exports = { loadCommands };
