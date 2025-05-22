const fs = require('fs');
const path = require('path');
const { log } = require('../utils/logger');

/**
 * Loads all event files from the events directory
 * @param {Client} client - The Discord.js client
 */
async function loadEvents(client) {
  const eventsPath = path.join(__dirname, '../events');
  const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
  
  log('info', `Loading ${eventFiles.length} events...`);
  
  for (const file of eventFiles) {
    try {
      const filePath = path.join(eventsPath, file);
      const event = require(filePath);
      
      if (!event.name || !event.execute) {
        log('warn', `The event at ${filePath} is missing a required "name" or "execute" property`);
        continue;
      }
      
      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
      } else {
        client.on(event.name, (...args) => event.execute(...args, client));
      }
      
      log('info', `Loaded event: ${event.name}`);
    } catch (error) {
      log('error', `Error loading event file ${file}: ${error.message}`);
    }
  }
  
  log('info', `Successfully loaded ${eventFiles.length} events`);
}

module.exports = { loadEvents };
