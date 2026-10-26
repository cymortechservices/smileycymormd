'use strict';

/**
 * SMILEY CYMOR MD — core loader.
 *
 * The original script downloaded its core files (cymor.js, lib/, database/, action/)
 * from a third-party GitHub repository every time the bot started. That would silently
 * overwrite this branding and let someone else change the code running on your bot,
 * so it has been removed. Everything ships inside this project and runs locally.
 *
 * To update the bot: pull/push changes to YOUR repo and redeploy (or use the .update
 * command if you configured GITHUB_REPO + HEROKU_API + APP_NAME).
 */

const fs = require('fs');
const path = require('path');

const REQUIRED = ['cymor.js', 'lib/ravenfunc.js', 'lib/handler.js', 'database/config.js', 'action/events.js'];

async function fetchCore() {
  const missing = REQUIRED.filter(f => !fs.existsSync(path.join(__dirname, f)));
  if (missing.length) {
    console.error('❌ Core files missing from this install:', missing.join(', '));
    console.error('   Re-upload the full smiley-cymor-md folder.');
    process.exit(1);
  }
  console.log('✅ SMILEY CYMOR MD core loaded (local files, no remote updates)');
}

module.exports = { fetchCore };
