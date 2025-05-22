const { Collection } = require('discord.js');
const { log } = require('./logger');

// In-memory database to store guild settings and deleted items
const guildSettings = new Collection();
const deletedItems = new Collection();

/**
 * Initialize the database for a guild if not already initialized
 * @param {string} guildId - The ID of the guild
 */
function initializeGuildSettings(guildId) {
  if (!guildSettings.has(guildId)) {
    guildSettings.set(guildId, {
      // Security settings
      antiNuke: false,
      antiRoleCreate: false,
      antiRoleDelete: false,
      antiChannelCreate: false,
      antiChannelDelete: false,
      antiBotAdd: false,
      antiWebhookCreate: false,
      
      // Whitelist
      whitelist: [],
      
      // Security tools
      securityLogsChannelId: null,
      securityRoleId: null
    });
    
    log('info', `Initialized settings for guild ${guildId}`);
  }
}

/**
 * Initialize the deleted items storage for a guild if not already initialized
 * @param {string} guildId - The ID of the guild
 */
function initializeDeletedItems(guildId) {
  if (!deletedItems.has(guildId)) {
    deletedItems.set(guildId, {
      channels: [],
      roles: []
    });
    
    log('info', `Initialized deleted items storage for guild ${guildId}`);
  }
}

/**
 * Initialize the database
 */
function initializeDatabase() {
  // No initialization needed for in-memory database
  log('info', 'In-memory database initialized');
}

/**
 * Get settings for a guild
 * @param {string} guildId - The ID of the guild
 * @returns {Object} The guild settings
 */
function getGuildSettings(guildId) {
  initializeGuildSettings(guildId);
  return guildSettings.get(guildId);
}

/**
 * Update a setting for a guild
 * @param {string} guildId - The ID of the guild
 * @param {string} key - The setting key to update
 * @param {any} value - The new value for the setting
 */
function updateGuildSettings(guildId, key, value) {
  initializeGuildSettings(guildId);
  const settings = guildSettings.get(guildId);
  settings[key] = value;
  guildSettings.set(guildId, settings);
  
  log('info', `Updated setting ${key} for guild ${guildId}`);
}

/**
 * Add a user to the whitelist
 * @param {string} guildId - The ID of the guild
 * @param {string} userId - The ID of the user to whitelist
 */
function addToWhitelist(guildId, userId) {
  initializeGuildSettings(guildId);
  const settings = guildSettings.get(guildId);
  
  if (!settings.whitelist) {
    settings.whitelist = [];
  }
  
  if (!settings.whitelist.includes(userId)) {
    settings.whitelist.push(userId);
    guildSettings.set(guildId, settings);
    
    log('info', `Added user ${userId} to whitelist for guild ${guildId}`);
  }
}

/**
 * Remove a user from the whitelist
 * @param {string} guildId - The ID of the guild
 * @param {string} userId - The ID of the user to remove from whitelist
 */
function removeFromWhitelist(guildId, userId) {
  initializeGuildSettings(guildId);
  const settings = guildSettings.get(guildId);
  
  if (!settings.whitelist) {
    settings.whitelist = [];
    return;
  }
  
  settings.whitelist = settings.whitelist.filter(id => id !== userId);
  guildSettings.set(guildId, settings);
  
  log('info', `Removed user ${userId} from whitelist for guild ${guildId}`);
}

/**
 * Add a deleted item to the storage for potential restoration
 * @param {string} guildId - The ID of the guild
 * @param {string} itemType - The type of the deleted item ('channel' or 'role')
 * @param {Object} itemData - The data of the deleted item
 */
function addDeletedItem(guildId, itemType, itemData) {
  initializeDeletedItems(guildId);
  const items = deletedItems.get(guildId);
  
  // Keep only the most recent 20 items of each type
  if (itemType === 'channel') {
    items.channels.unshift(itemData);
    if (items.channels.length > 20) {
      items.channels = items.channels.slice(0, 20);
    }
  } else if (itemType === 'role') {
    items.roles.unshift(itemData);
    if (items.roles.length > 20) {
      items.roles = items.roles.slice(0, 20);
    }
  }
  
  deletedItems.set(guildId, items);
  
  log('info', `Added deleted ${itemType} "${itemData.name}" to storage for guild ${guildId}`);
}

/**
 * Get deleted items for a guild
 * @param {string} guildId - The ID of the guild
 * @returns {Object} The deleted items
 */
function getDeletedItems(guildId) {
  initializeDeletedItems(guildId);
  return deletedItems.get(guildId);
}

module.exports = {
  initializeDatabase,
  getGuildSettings,
  updateGuildSettings,
  addToWhitelist,
  removeFromWhitelist,
  addDeletedItem,
  getDeletedItems
};
