'use strict';

/**
 * SMILEY CYMOR MD — single source of truth for branding.
 * Change a value here and it updates everywhere in the bot.
 */
const ownerNumber = (process.env.OWNER_NUMBER || '254113821327').replace(/\D/g, '');

module.exports = {
  name: 'SMILEY CYMOR MD',
  nameBold: '𝐒𝐌𝐈𝐋𝐄𝐘 𝐂𝐘𝐌𝐎𝐑 𝐌𝐃',
  short: 'Smiley Cymor',
  owner: 'Legendary Smiley Cymor',
  ownerNumber,                                   // international format, no +
  ownerChat: `https://wa.me/${ownerNumber}`,
  motto: 'No one does it better than me',
  channelName: 'SMILEY CYMOR MD USERS',
  channel: 'https://whatsapp.com/channel/0029VbBq8Y1HQbS0YTkiYk0E',
  channelCode: '0029VbBq8Y1HQbS0YTkiYk0E',
  poweredBy: 'CymorTechServices',
  version: '1.0.0',

  // Deployment links (set these as environment variables, see GO-LIVE.md)
  pairUrl: (process.env.PAIR_URL || '').replace(/\/+$/, ''),   // e.g. https://smiley-cymor-pair.onrender.com
  repo: process.env.GITHUB_REPO || '',                           // e.g. yourname/smiley-cymor-md
};
