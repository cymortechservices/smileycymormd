'use strict';

const fs = require('fs');
const path = require('path');
const brand = require('../brand');

// ─── Fancy text helpers ──────────────────────────────────────────────────────
const mapChars = (str, up, low, dig) => [...str].map(c => {
  const code = c.charCodeAt(0);
  if (code >= 65 && code <= 90) return String.fromCodePoint(up + code - 65);
  if (code >= 97 && code <= 122) return String.fromCodePoint(low + code - 97);
  if (dig && code >= 48 && code <= 57) return String.fromCodePoint(dig + code - 48);
  return c;
}).join('');
const bold = s => mapChars(s, 0x1D5D4, 0x1D5EE, 0x1D7EC);       // 𝗕𝗼𝗹𝗱
const boldItalic = s => mapChars(s, 0x1D63C, 0x1D656, 0);          // 𝘽𝙤𝙡𝙙 𝙄𝙩𝙖𝙡𝙞𝙘
const cmdName = n => (n || '').toLowerCase();

// ─── Category themes: every category gets its own colour + icon ──────────────
const THEMES = {
  ai:        { icon: '🤖', dot: '🟣', title: 'AI & CHAT' },
  downloads: { icon: '📥', dot: '🟢', title: 'DOWNLOADS' },
  media:     { icon: '🎬', dot: '🟠', title: 'MEDIA STUDIO' },
  converter: { icon: '🔄', dot: '🔵', title: 'CONVERTERS' },
  coding:    { icon: '💻', dot: '⚫', title: 'CODING' },
  utility:   { icon: '🛠️', dot: '🟡', title: 'UTILITIES' },
  owner:     { icon: '👑', dot: '🔴', title: 'OWNER ZONE' },
  group:     { icon: '👥', dot: '🔵', title: 'GROUP POWER' },
  effects:   { icon: '✨', dot: '🟣', title: 'EFFECTS' },
  football:  { icon: '⚽', dot: '🟢', title: 'FOOTBALL' },
  stalk:     { icon: '🔎', dot: '🟤', title: 'SEARCH & STALK' },
  others:    { icon: '🎲', dot: '🟠', title: 'FUN & MORE' },
  misc:      { icon: '📦', dot: '⚪', title: 'MISC' },
};
const ORDER = ['ai', 'downloads', 'media', 'converter', 'effects', 'utility', 'group', 'football', 'stalk', 'coding', 'others', 'owner', 'misc'];
const theme = c => THEMES[c] || { icon: '📌', dot: '⚪', title: c.toUpperCase() };

// ─── Data helpers ────────────────────────────────────────────────────────────
function collectCommands() {
  const byCategory = {};
  const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.js') && f !== 'menu.js');
  for (const file of files) {
    try {
      const list = require(path.join(__dirname, file));
      for (const plugin of (Array.isArray(list) ? list : [list])) {
        const cat = plugin.category || 'misc';
        const cmds = Array.isArray(plugin.command) ? plugin.command : [plugin.command];
        if (!cmds[0]) continue;
        (byCategory[cat] = byCategory[cat] || []).push({
          name: cmdName(cmds[0]),
          aliases: plugin.aliases || [],
          description: plugin.description || '',
        });
      }
    } catch {}
  }
  for (const k of Object.keys(byCategory)) byCategory[k].sort((a, b) => a.name.localeCompare(b.name));
  return byCategory;
}

const sortedCats = by => [...Object.keys(by)].sort((a, b) => {
  const ia = ORDER.indexOf(a), ib = ORDER.indexOf(b);
  return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
});

function nairobi() {
  const now = new Date();
  const hour = Number(new Intl.DateTimeFormat('en-GB', { hour: '2-digit', hour12: false, timeZone: 'Africa/Nairobi' }).format(now)) % 24;
  const time = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Africa/Nairobi' }).format(now);
  const date = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Africa/Nairobi' }).format(now);
  const greet = hour < 5 ? '🌙 Good night' : hour < 12 ? '🌅 Good morning' : hour < 17 ? '☀️ Good afternoon' : hour < 21 ? '🌇 Good evening' : '🌙 Good night';
  return { time, date, greet };
}

function uptimeStr(sec) {
  sec = Math.floor(sec);
  const d = Math.floor(sec / 86400), h = Math.floor(sec % 86400 / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
  return `${d ? d + 'd ' : ''}${h}h ${m}m ${s}s`;
}

// ─── Layout builders ─────────────────────────────────────────────────────────
function headerCard({ pushname, mode, prefix, total, cats, Rspeed }) {
  const t = nairobi();
  const mem = (process.memoryUsage().rss / 1048576).toFixed(0);
  return [
    `╔═══════════════════════╗`,
    `   😄 ${bold('SMILEY CYMOR MD')} 😄`,
    `   💫 ${boldItalic(brand.motto)} 💫`,
    `╚═══════════════════════╝`,
    ``,
    `${t.greet}, *${pushname}*! 👋`,
    ``,
    `┏━━━━━〔 🔮 ${bold('BOT CARD')} 〕━━━━━┓`,
    `┃ 👑 ${bold('Owner')}    ➜ ${brand.owner}`,
    `┃ 🛡️ ${bold('Mode')}     ➜ ${String(mode).toUpperCase()}`,
    `┃ 🎯 ${bold('Prefix')}   ➜ [ ${prefix} ]`,
    `┃ 🧩 ${bold('Commands')} ➜ ${total}  •  ${cats} categories`,
    `┃ ⏱️ ${bold('Uptime')}   ➜ ${uptimeStr(process.uptime())}`,
    `┃ 💾 ${bold('RAM')}      ➜ ${mem} MB`,
    `┃ ⚡ ${bold('Speed')}    ➜ ${Number(Rspeed || 0).toFixed(3)} ms`,
    `┃ 🕒 ${bold('Time')}     ➜ ${t.time} • ${t.date}`,
    `┗━━━━━━━━━━━━━━━━━━━━━━┛`,
  ].join('\n');
}

function fullMenu(by, ctx) {
  const cats = sortedCats(by);
  let out = '';
  for (const cat of cats) {
    const th = theme(cat);
    const list = by[cat];
    out += `\n╭─────〔 ${th.icon} ${bold(th.title)} 〕─────╮\n`;
    out += `│ ${th.dot} ${boldItalic(list.length + (list.length === 1 ? ' command' : ' commands'))}\n`;
    out += `├──────────────────\n`;
    for (const c of list) out += `│ ${th.dot} ${ctx.prefix}${c.name}\n`;
    out += `╰──────────────────╯\n`;
  }
  out += `\n💡 ${bold('Tip')}: ${ctx.prefix}menu <category> shows descriptions\n`;
  out += `   e.g. ${ctx.prefix}menu downloads\n\n`;
  out += `📣 ${bold(brand.channelName)}\n${brand.channel}\n\n`;
  out += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  out += `😄 ${bold('SMILEY CYMOR MD')} • ${boldItalic(brand.motto)}\n`;
  out += `⚡ ${boldItalic('Powered by ' + brand.poweredBy)}\n`;
  out += `━━━━━━━━━━━━━━━━━━━━━━`;
  return out;
}

function categoryMenu(cat, list, ctx) {
  const th = theme(cat);
  let out = `╭─────〔 ${th.icon} ${bold(th.title)} 〕─────╮\n`;
  out += `│ ${th.dot} ${boldItalic(list.length + (list.length === 1 ? ' command' : ' commands'))}\n╰──────────────────╯\n\n`;
  for (const c of list) {
    out += `${th.dot} *${ctx.prefix}${c.name}*\n`;
    if (c.description) out += `   ↳ _${c.description}_\n`;
    if (c.aliases.length) out += `   ↳ also: ${c.aliases.slice(0, 4).map(a => ctx.prefix + a).join(', ')}\n`;
  }
  out += `\n😄 ${bold('SMILEY CYMOR MD')} • ${boldItalic(brand.motto)}`;
  return out;
}

// ─── Media ───────────────────────────────────────────────────────────────────
const MEDIA_DIR = path.join(__dirname, '..', 'media');
function readMedia(video) {
  try { return fs.readFileSync(path.join(MEDIA_DIR, video ? 'menu.mp4' : 'menu.jpg')); } catch { return null; }
}
const thumb = () => { try { return fs.readFileSync(path.join(MEDIA_DIR, 'logo-small.jpg')); } catch { return undefined; } };

module.exports = [
  {
    command: ['menu', 'help'],
    aliases: ['allmenu', 'commands'],
    description: 'Show the colourful command menu',
    category: 'menu',
    handler: async (client, m, { prefix, mode, menutype, pushname, Rspeed, text }) => {
      const by = collectCommands();
      const cats = sortedCats(by);
      const total = Object.values(by).reduce((s, a) => s + a.length, 0);
      const ctx = { prefix, mode, pushname, Rspeed, total, cats: cats.length };
      const quoted = { quoted: m };

      // ── .menu <category> ──
      const want = (text || '').trim().toLowerCase();
      if (want) {
        const hit = cats.find(c => c === want || theme(c).title.toLowerCase().includes(want));
        if (!hit) {
          const names = cats.map(c => `${theme(c).dot} ${c}`).join('\n');
          return client.sendMessage(m.chat, { text: `❌ No category called *${want}*.\n\n${bold('Categories')}:\n${names}\n\nTry: ${prefix}menu downloads` }, quoted);
        }
        return client.sendMessage(m.chat, { text: categoryMenu(hit, by[hit], ctx) }, quoted);
      }

      const head = headerCard(ctx);
      const body = fullMenu(by, ctx);
      const sendText = (t = head + '\n' + body) => client.sendMessage(m.chat, { text: t }, quoted);

      try {
        if (menutype === 'video' || menutype === 'image') {
          const isVideo = menutype === 'video';
          const buffer = readMedia(isVideo);
          if (!buffer) return await sendText();
          const content = isVideo
            ? { video: buffer, mimetype: 'video/mp4', caption: head, gifPlayback: true }
            : { image: buffer, caption: head };
          try {
            await client.sendMessage(m.chat, content, quoted);
            await client.sendMessage(m.chat, { text: body }, quoted);
          } catch (e) {
            console.error('[menu] media send failed:', e.message);
            await sendText();
          }
        } else if (menutype === 'link') {
          await client.sendMessage(m.chat, {
            text: head + '\n' + body,
            contextInfo: {
              externalAdReply: {
                showAdAttribution: false,
                title: brand.name,
                body: brand.motto,
                thumbnail: thumb(),
                sourceUrl: brand.channel,
                mediaType: 1,
                renderLargerThumbnail: true,
              },
            },
          }, quoted);
        } else {
          await sendText();
        }
      } catch (err) {
        console.error('[menu] send failed:', err);
        try { await sendText(); } catch (e) { console.error('[menu] text fallback failed:', e); }
      }
    },
  },
];
