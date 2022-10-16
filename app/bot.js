let QRCode = require('qrcode')
const { Client, MessageMedia, List, Buttons, LocalAuth } = require('whatsapp-web.js');
const multer = require('multer');
const request = require('request');
const fs = require('fs');


const client = new Client({
    authStrategy: new LocalAuth({ clientId: "client-bot" }),
    puppeteer: {headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox']},
});
/**
 * Start initiate bot
 * 
 * this bunch of function is to initialize the bot before running
*/

app.post('/bot/connection', multer().any(), async (request, response) => {
    connection = ''
    client.getState().then((data) => { 
        return response.status(200).json({ connection: data });
    });
});


app.get('/bot/destroy', multer().any(), async (request, response) => {
    const dir = '.wwebjs_auth/session-client-bot'
    await fs.rm(dir, { recursive: true, force: true }, err => {
        if (err) {
            throw err
        }
    
        console.log(`${dir} is deleted!`)
    })
    io.emit('wa_bot_log', `${now} : Destroy`);
    client.destroy();
    client.initialize();
    return response.status(200).send('Destroyed');
});

client.initialize();

client.on('loading_screen', (percent, message) => {
    console.log('wait a sec..', percent, message);
});


client.on('loading_screen', (percent, message) => {
    io.emit("wa_bot_log", `${now} : Loading ${percent}% ${message}`);
});

client.on('qr', qr => {
    QRCode.toString(qr,{type:'terminal'}, function (err, url) {
        QRCode.toDataURL(qr, function (err, url) {
            io.emit("wa_bot_qr", url);
            io.emit('wa_bot_log', `QR Code received`);
        })
      })
});

client.on('ready', () => {
    io.emit("wa_bot_log", `${now} : WhatsApp is ready!`);
});

client.on('authenticated', () => {
    io.emit("wa_bot_log", `${now} : Whatsapp is authenticated!`);
});

client.on('auth_failure', function(session) {
    io.emit('wa_bot_log', `${now} : Auth failure, restarting...`);
});

client.on('disconnected', function() {
    client.destroy();
    client.initialize();
    return response.status(200).send('session destroyed');
  });


/**
 * END of initiate bot
*/
let download = function(uri, filename, callback){
    request.head(uri, function(err, res, body){
      request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
    });
  };
/**
 *  this function is used for sending
 *  you can use by hit endpoint `/send`
 * 
 * Args(form body) :
 * @param {string} number - user wa phone number
 * @param {string} message - message you want to send
*/
app.post('/send/media', multer().any(), async (request, response) => {
    let message = request.body.message;
    let attachmentUrl = request.body.attachmentUrl;
    let attachmentName = request.body.attachmentName;
    let phoneNumber = request.body.number;

    if(phoneNumber === 'status@broadcast'){
        return response.status(200).send('brodcast received');
    }
    // check for number in request
    if (!phoneNumber) {
        return response.status(400).send('Number not found');
    }
    number = phoneNumber.includes('@c.us') ? phoneNumber : `${phoneNumber}@c.us`;
    // check for is number is registered
    const registered =  await client.isRegisteredUser(number);
    if(!registered){
        return response.status(400).send('Invalid number');    
    }
    await download(attachmentUrl, attachmentName, function(){
    console.log('done');
    let attachment =  MessageMedia.fromFilePath(attachmentName);
    client.sendMessage(number, attachment,{caption:message});
    return response.status(200).send('message sended');
    });
});

/**
 *  this function is used for sending
 *  you can use by hit endpoint `/send`
 * 
 * Args(form body) :
 * @param {string} number - user wa phone number
 * @param {string} message - message you want to send
*/
app.post('/send/message', multer().any(), async (request, response) => {
    let message = request.body.message;
    let phoneNumber = request.body.number;

    if(phoneNumber === 'status@broadcast'){
        return response.status(200).send('brodcast received');
    }
    // check for number in request
    if (!phoneNumber) {
        return response.status(400).send('Number not found');
    }
    number = phoneNumber.includes('@c.us') ? phoneNumber : `${phoneNumber}@c.us`;
    // check for is number is registered
    const registered =  await client.isRegisteredUser(number);
    if(!registered){
        return response.status(400).send('Invalid number');    
    }
    await client.sendMessage(number, message);
    return response.status(200).send('message sended');
});

/**
 *  this function is used for sending
 *  you can use by hit endpoint `/send`
 * 
 * Args(form body) :
 * @param {string} number - user wa phone number
 * @param {string} message - message you want to send
*/
app.post('/send/button', multer().any(), async (request, response) => {
    let message = request.body.message;
    let phoneNumber = request.body.number;
    let title = request.body.title;
    let footer = request.body.footer;
    let buttons = JSON.parse(request.body.buttons);

    if(phoneNumber === 'status@broadcast'){
        return response.status(200).send('brodcast received');
    }
    // check for number in request
    if (!phoneNumber) {
        return response.status(400).send('Number not found');
    }
    number = phoneNumber.includes('@c.us') ? phoneNumber : `${phoneNumber}@c.us`;
    // check for is number is registered
    const registered =  await client.isRegisteredUser(number);
    if(!registered){
        return response.status(400).send('Invalid number');    
    }
    
    const buttons_reply = new Buttons(message, buttons, title, footer)
    
    // send to number
    for (const component of [buttons_reply]) await client.sendMessage(number, component);

    return response.status(200).send('message sended');
});

/**
 *  this function is used for sending
 *  you can use by hit endpoint `/send`
 * 
 * Args(form body) :
 * @param {string} number - user wa phone number
 * @param {string} message - message you want to send
*/
app.post('/send/list', multer().any(), async (request, response) => {
    let message = request.body.message;
    let phoneNumber = request.body.number;
    let cta = request.body.cta;
    let title = request.body.title;
    let footer = request.body.footer;
    let buttons = JSON.parse(request.body.buttons);


    if(phoneNumber === 'status@broadcast'){
        return response.status(200).send('brodcast received');
    }
    // check for number in request
    if (!phoneNumber) {
        return response.status(400).send('Number not found');
    }
    number = phoneNumber.includes('@c.us') ? phoneNumber : `${phoneNumber}@c.us`;
    // check for is number is registered
    const registered =  await client.isRegisteredUser(number);
    if(!registered){
        return response.status(400).send('Invalid number');    
    }

    const section = {
    title: title,
    rows: buttons
    };

    const list = new List(message, cta, [section], title, footer)
    await client.sendMessage(number, list);
    return response.status(200).send('message sended');
});

app.post('/send/dialogflow', multer().any(), async (request, response) => {
    return response.status(200).send(await Chatting(msg.body,msg.from));
});


client.on('message', async msg => {
    if (msg.type != "chat" && msg.type != "list_response" && msg.type != "buttons_response") {
        msg["body"] = "user send "+msg.type;
    }

    let chat = await Chatting(msg.body,msg.from);
    if (chat == 'no intent') {
        console.log('no intent');
        msg["isDialogFlow"] = false;
    }else{
        console.log('intent');
        msg["isDialogFlow"] = true;
        msg["dialogFlowChat"] = chat;
    }
    let clientServerOptions = {
        uri: webhookCallback,
        body: JSON.stringify(msg),
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    }
    request(clientServerOptions, function (error, response) {
        if (!error && (response && response.statusCode) === 200) {
            console.log("success");
            return 200;
        }else{
            return 500;
        }
    });
});
