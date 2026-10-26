const brand = require('./brand');

const session = process.env.SESSION || '';
const appname = process.env.APP_NAME || '';
const herokuapi = process.env.HEROKU_API;
const botname = process.env.BOTNAME || brand.name;
const author = process.env.STICKER_AUTHOR || brand.owner;
const packname = process.env.STICKER_PACKNAME || brand.name;
const dev = process.env.DEV || brand.ownerNumber;
const owner = dev.split(",").map(n => n.trim()).filter(Boolean);
const bad = process.env.BAD_WORD || 'fuck,umbwa,kuma,pussy,slut,bitch,cock,stupid';
const admin = process.env.ADMIN_MSG || '𝗖𝗼𝗺𝗺𝗮𝗻𝗱 𝗿𝗲𝘀𝗲𝗿𝘃𝗲𝗱 𝗳𝗼𝗿 𝗔𝗱𝗺𝗶𝗻𝘀!';
const group = process.env.GROUP_ONLY_MSG || '𝗖𝗼𝗺𝗺𝗮𝗻𝗱 𝗺𝗲𝗮𝗻𝘁 𝗳𝗼𝗿 𝗚𝗿𝗼𝘂𝗽𝘀!';
const botAdmin = process.env.BOT_ADMIN_MSG || '𝗜 𝗻𝗲𝗲𝗱 𝗔𝗱𝗺𝗶𝗻 𝗽𝗿𝗶𝘃𝗶𝗹𝗲𝗴𝗲𝘀!';
const NotOwner = process.env.NOT_OWNER_MSG || '𝗖𝗼𝗺𝗺𝗮𝗻𝗱 𝗺𝗲𝗮𝗻𝘁 𝗳𝗼𝗿 𝘁𝗵𝗲 𝗼𝘄𝗻𝗲𝗿!';
const mycode = process.env.CODE || '254';
const port = process.env.PORT || 10000;

module.exports = {
  session,
  author,
  packname,
  dev,
  owner,
  bad,
  group,
  NotOwner,
  botname,
  botAdmin,
  admin,
  mycode,
  herokuapi,
  port,
  appname
};
