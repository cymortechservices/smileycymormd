'use strict';
/**
 * Channel helpers for SMILEY CYMOR MD
 *  - sendWithChannelButton(): ONE message (media + text) carrying a "View Channel" button
 *  - followChannel():         make the connected account follow the channel
 *
 * How the button is delivered (always ONE message, and it ALWAYS arrives):
 *   auto (default) -> if the installed WhatsApp library supports interactive buttons, use it
 *                     (real tappable "View Channel" button); otherwise send the message as
 *                     "forwarded from the channel", which WhatsApp renders with the channel
 *                     header + "View channel" link.
 *   MENU_BUTTON=forward -> always use the channel-forward style
 *   MENU_BUTTON=native  -> force the hand-built native-flow button (experimental)
 */
const fs = require('fs');
const path = require('path');
const brand = require('../brand');

let _baileys;
const baileys = () => (_baileys = _baileys || require('@whiskeysockets/baileys'));

// ─── channel JID ─────────────────────────────────────────────────────────────
async function resolveChannelJid(client) {
  if (global.__cymorChannelJid) return global.__cymorChannelJid;
  const fixed = `${process.env.CHANNEL_JID || ''}`.trim();
  if (fixed) return (global.__cymorChannelJid = fixed);
  for (let i = 0; i < 2; i++) {
    try {
      const meta = await client.newsletterMetadata('invite', brand.channelCode);
      if (meta && meta.id) return (global.__cymorChannelJid = meta.id);
    } catch (_) { await new Promise(r => setTimeout(r, 1500)); }
  }
  return null;
}

async function newsletterContext(client) {
  const jid = await resolveChannelJid(client);
  if (!jid) return null;
  return {
    isForwarded: true,
    forwardingScore: 1,
    forwardedNewsletterMessageInfo: { newsletterJid: jid, newsletterName: brand.channelName, serverMessageId: 143 },
  };
}

// ─── does the installed Baileys fork know about interactive buttons? ─────────
function forkSupportsInteractive() {
  if (global.__cymorInteractive !== undefined) return global.__cymorInteractive;
  let found = false;
  try {
    const main = require.resolve('@whiskeysockets/baileys');
    const stack = [path.dirname(main)];
    let scanned = 0;
    while (stack.length && !found && scanned < 600) {
      const dir = stack.pop();
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) { if (e.name !== 'node_modules') stack.push(p); }
        else if (/\.js$/.test(e.name)) {
          scanned++;
          if (fs.readFileSync(p, 'utf8').includes('interactiveButtons')) { found = true; break; }
        }
      }
    }
  } catch (_) {}
  global.__cymorInteractive = found;
  console.log(`[channel] interactive buttons in Baileys fork: ${found ? 'YES (real button)' : 'no (using channel-forward style)'}`);
  return found;
}

const withTimeout = (p, ms, what) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(what + ' timed out')), ms))]);

const buttonList = () => [{
  name: 'cta_url',
  buttonParamsJson: JSON.stringify({ display_text: process.env.CHANNEL_BUTTON_TEXT || 'View Channel', url: brand.channel, merchant_url: brand.channel }),
}];

// legacy hand-built native-flow message (only when MENU_BUTTON=native)
async function relayNative(client, jid, { image, video, gif, caption, footer }, quoted) {
  const { generateWAMessageFromContent, prepareWAMessageMedia, proto } = baileys();
  let header = { title: '', subtitle: '', hasMediaAttachment: false };
  if (image || video) {
    const media = await prepareWAMessageMedia(image ? { image } : { video, gifPlayback: !!gif }, { upload: client.waUploadToServer });
    header = { title: '', subtitle: '', hasMediaAttachment: true, ...media };
  }
  const interactive = proto.Message.InteractiveMessage.create({
    header: proto.Message.InteractiveMessage.Header.create(header),
    body: proto.Message.InteractiveMessage.Body.create({ text: caption }),
    footer: proto.Message.InteractiveMessage.Footer.create({ text: footer || '' }),
    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({ buttons: buttonList(), messageParamsJson: '' }),
  });
  const msg = generateWAMessageFromContent(jid, {
    viewOnceMessage: { message: { messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 }, interactiveMessage: interactive } },
  }, { quoted, userJid: client.user.id });
  const additionalNodes = [{ tag: 'biz', attrs: {}, content: [{ tag: 'interactive', attrs: { type: 'native_flow', v: '1' }, content: [{ tag: 'native_flow', attrs: { v: '9', name: 'mixed' } }] }] }];
  if (!String(jid).endsWith('@g.us')) additionalNodes.push({ tag: 'bot', attrs: { biz_bot: '1' } });
  await client.relayMessage(jid, msg.message, { messageId: msg.key.id, additionalNodes });
}

/**
 * Send: [image | video | nothing] + body text + footer + "View Channel" button — in ONE message.
 * Never throws for delivery problems: it falls through to the next style.
 */
async function sendWithChannelButton(client, jid, { image, video, gif, caption, footer }, quoted) {
  const mode = String(process.env.MENU_BUTTON || 'auto').toLowerCase();

  // 1) a real button
  if (mode === 'native') {
    try { await withTimeout(relayNative(client, jid, { image, video, gif, caption, footer }, quoted), 30000, 'native button'); return { mode: 'native' }; }
    catch (e) { console.error('[channel-button] native send failed:', e.message); }
  } else if (mode === 'auto' && forkSupportsInteractive()) {
    try {
      const payload = image ? { image, caption }
        : video ? { video, gifPlayback: !!gif, mimetype: 'video/mp4', caption }
          : { text: caption };
      payload.footer = footer || '';
      payload.interactiveButtons = buttonList();
      await withTimeout(client.sendMessage(jid, payload, { quoted }), 45000, 'button message');
      return { mode: 'button' };
    } catch (e) { console.error('[channel-button] button send failed:', e.message); }
  }

  // 2) channel-forward style (still one message, always delivered)
  const contextInfo = await newsletterContext(client);
  const text = `${caption}${footer ? '\n\n' + footer : ''}${contextInfo ? '' : `\n\n📢 ${brand.channelName}\n${brand.channel}`}`;
  const base = image ? { image, caption: text }
    : video ? { video, gifPlayback: !!gif, mimetype: 'video/mp4', caption: text }
      : { text };
  if (contextInfo) base.contextInfo = contextInfo;
  await client.sendMessage(jid, base, { quoted });
  return { mode: 'forward' };
}

// make the connected account follow the channel (safe to call repeatedly)
async function followChannel(client) {
  if (String(process.env.AUTO_FOLLOW_CHANNEL || 'true').toLowerCase() === 'false') return false;
  try {
    const jid = await resolveChannelJid(client);
    if (!jid) return false;
    await client.newsletterFollow(jid);
    return true;
  } catch (_) { return false; }
}

// call once after connecting: resolves the channel id + checks button support, logs the result
async function warmUp(client) {
  forkSupportsInteractive();
  const jid = await resolveChannelJid(client);
  console.log(`[channel] channel id: ${jid || 'not resolved (will show link text instead)'}`);
}

module.exports = { sendWithChannelButton, followChannel, newsletterContext, resolveChannelJid, warmUp, forkSupportsInteractive };
