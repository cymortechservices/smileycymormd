'use strict';
/**
 * View-once saver for SMILEY CYMOR MD.
 *
 * Triggers (owner only):
 *   1. React to a view-once photo / video / voice note with ANY emoji (❤️ 😍 🔥 …) -> saved to your DM
 *   2. Reply to it with an emoji (see media.js "vv2" list)                         -> saved to your DM
 *   3. .vv (to the chat) / .vv2 (to your DM)
 *
 * The media is downloaded the moment a view-once message ARRIVES and kept in memory (WhatsApp
 * removes the file from its servers once it has been opened, so waiting for the reaction is too late).
 * No temp files are written.
 */
const { jidNormalizedUser } = require('@whiskeysockets/baileys');
const S = require('./style');
const brand = require('../brand');

const MAX_ITEMS = 60;
const MAX_ITEM_BYTES = 40 * 1024 * 1024;
const MAX_TOTAL_BYTES = 90 * 1024 * 1024;
const cache = new Map();           // messageId -> { type, node, buffer, sender, chat, at }
let totalBytes = 0;

const unwrap = (msg) => {
  let cur = msg;
  for (let i = 0; i < 6 && cur; i++) {
    const next = cur.ephemeralMessage?.message || cur.viewOnceMessageV2?.message || cur.viewOnceMessageV2Extension?.message ||
      cur.viewOnceMessage?.message || cur.documentWithCaptionMessage?.message;
    if (!next) break;
    cur = next;
  }
  return cur || {};
};

// returns { type, node } for a view-once image/video/audio, otherwise null
function findViewOnce(message) {
  if (!message) return null;
  const wrapped = !!(message.viewOnceMessageV2 || message.viewOnceMessageV2Extension || message.viewOnceMessage ||
    message.ephemeralMessage?.message?.viewOnceMessageV2 || message.ephemeralMessage?.message?.viewOnceMessage ||
    message.ephemeralMessage?.message?.viewOnceMessageV2Extension);
  const inner = unwrap(message);
  for (const type of ['imageMessage', 'videoMessage', 'audioMessage']) {
    const node = inner[type];
    if (node && (wrapped || node.viewOnce)) return { type, node };
  }
  return null;
}

async function download(client, key, type, node) {
  const { downloadMediaMessage } = require('@whiskeysockets/baileys');
  return downloadMediaMessage({ key, message: { [type]: node } }, 'buffer', {}, { reuploadRequest: client.updateMediaMessage, logger: console });
}

function evict() {
  while (cache.size > MAX_ITEMS || totalBytes > MAX_TOTAL_BYTES) {
    const k = cache.keys().next().value;
    if (k === undefined) break;
    totalBytes -= (cache.get(k).buffer?.length || 0);
    cache.delete(k);
  }
}

/** call for every incoming message: grabs view-once media right away (fire and forget) */
function remember(client, mek) {
  try {
    const found = findViewOnce(mek.message);
    if (!found || !mek.key?.id || mek.key.fromMe) return;
    const entry = {
      type: found.type, node: found.node, buffer: null, key: mek.key,
      sender: jidNormalizedUser(mek.key.participant || mek.key.remoteJid || ''),
      chat: mek.key.remoteJid, at: Date.now(),
    };
    cache.set(mek.key.id, entry);
    download(client, mek.key, found.type, found.node).then(buf => {
      if (!buf || buf.length > MAX_ITEM_BYTES || !cache.has(mek.key.id)) return;
      entry.buffer = buf; totalBytes += buf.length; evict();
    }).catch(e => console.error('[viewonce] pre-download failed:', e.message));
    evict();
  } catch (_) {}
}

/** send one view-once item to `jid` */
async function deliver(client, jid, item, quoted) {
  const { type, node } = item;
  const buffer = item.buffer || await download(client, item.key || {}, type, node);
  const who = item.sender ? `@${String(item.sender).split('@')[0].split(':')[0]}` : '';
  const where = item.chat && String(item.chat).endsWith('@g.us') ? 'group' : 'DM';
  const cap = [
    S.voice.vvSaved(),
    who ? `👤 ${S.small('from')} ${who} ${S.tiny('(' + where + ')')}` : '',
    node.caption ? `💬 ${node.caption}` : '',
  ].filter(Boolean).join('\n');
  const mentions = item.sender ? [item.sender] : [];
  const opt = quoted ? { quoted } : {};
  if (type === 'imageMessage') await client.sendMessage(jid, { image: buffer, caption: cap, mentions }, opt);
  else if (type === 'videoMessage') await client.sendMessage(jid, { video: buffer, mimetype: node.mimetype || 'video/mp4', caption: cap, mentions }, opt);
  else {
    await client.sendMessage(jid, { text: cap, mentions }, opt);
    await client.sendMessage(jid, { audio: buffer, mimetype: node.mimetype || 'audio/ogg; codecs=opus', ptt: !!node.ptt }, opt);
  }
  return true;
}

const digits = j => String(j || '').split('@')[0].split(':')[0].replace(/\D/g, '');
const ownerNumbers = () => {
  try { return require('../set').owner.map(digits); } catch { return [brand.ownerNumber]; }
};

/**
 * Hook for messages.upsert — "react to a view-once with an emoji".
 * Returns true when the event was a reaction (caller then skips normal processing).
 */
async function handleReaction(client, mek, store) {
  const r = mek.message?.reactionMessage;
  if (!r) return false;
  try {
    if (!r.text) return true;                              // reaction removed
    const me = jidNormalizedUser(client.user.id);
    // the reactor can show up as a phone-number JID or a LID — check every form we are given
    const ids = [mek.key.participant, mek.key.participantPn, mek.key.participantAlt, mek.key.remoteJid, mek.key.remoteJidAlt].filter(Boolean);
    const isOwner = mek.key.fromMe || ids.some(j => ownerNumbers().includes(digits(j)));
    if (!isOwner) return true;

    const id = r.key?.id;
    let item = cache.get(id) || null;
    if (!item && store && r.key?.remoteJid) {
      const stored = store.loadMessage(r.key.remoteJid, id);
      const f = stored && findViewOnce(stored.message);
      if (f) item = { ...f, key: stored.key, sender: stored.key?.participant || stored.key?.remoteJid, chat: stored.key?.remoteJid };
    }
    if (!item) return true;                                // not a view-once we know about
    // owner's own account -> "message yourself" chat; another owner number -> their DM
    const dest = mek.key.fromMe ? me : jidNormalizedUser(ids.find(j => ownerNumbers().includes(digits(j))) || me);
    await deliver(client, dest, item);
  } catch (e) {
    console.error('[viewonce] react-save failed:', e.message);
  }
  return true;
}

// used by .vv / .vv2 / emoji-reply: quotedMessage is the proto of the quoted message
async function saveQuoted(client, m, jid, quotedMessage, quoted) {
  const ctxInfo = m.msg?.contextInfo || {};
  const stanza = ctxInfo.stanzaId;
  let item = stanza && cache.get(stanza);
  if (!item) {
    const found = findViewOnce(quotedMessage) || (() => {
      const inner = unwrap(quotedMessage);
      for (const type of ['imageMessage', 'videoMessage', 'audioMessage']) if (inner[type]) return { type, node: inner[type] };
      return null;
    })();
    if (!found) return false;
    item = { ...found, key: { remoteJid: m.chat, id: stanza, participant: ctxInfo.participant }, sender: ctxInfo.participant, chat: m.chat };
  }
  return deliver(client, jid, item, quoted);
}

module.exports = { remember, handleReaction, saveQuoted, findViewOnce };
