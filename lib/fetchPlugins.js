'use strict';

/**
 * SMILEY CYMOR MD — plugin loader.
 * Plugins are loaded from the local /plugins folder only.
 * (The original downloaded plugins from a third-party GitHub repo on every start.)
 */

const fs = require('fs');
const path = require('path');

const PLUGIN_DIR = path.join(__dirname, '../plugins');

async function fetchPlugins() {
  if (!fs.existsSync(PLUGIN_DIR)) fs.mkdirSync(PLUGIN_DIR, { recursive: true });
  const count = fs.readdirSync(PLUGIN_DIR).filter(f => f.endsWith('.js')).length;
  console.log(`✅ ${count} plugin files ready (local)`);
}

module.exports = { fetchPlugins };
