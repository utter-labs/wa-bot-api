let QRCode = require('qrcode')
const { Client, MessageMedia, List, Buttons, LocalAuth } = require('whatsapp-web.js');
const multer = require('multer');
const request = require('request');
const fs = require('fs');
const path = require('path');
let qr = ''

const clientBlast = new Client({
    authStrategy: new LocalAuth({ clientId: "client-blast" }),
    puppeteer: {headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox']},
});

app.get('/log', multer().any(), async (request, response) => {
    return response.sendFile(path.join(__dirname, 'src/qr.html'));
});


app.post('/connection', multer().any(), async (request, response) => {
    connection = ''
    clientBlast.getState().then((data) => {
        return response.status(200).json({ connection: data });
    });
});


app.get('/destroy', multer().any(), async (request, response) => {
    const dir = '.wwebjs_auth/session-client-blast'
    await fs.rm(dir, { recursive: true, force: true }, err => {
        if (err) {
            throw err
        }
    
        console.log(`${dir} is deleted!`)
    })
    io.emit('wa_blast_log', `${now} : Destroy`);
    clientBlast.destroy();
    clientBlast.initialize();
    return response.status(200).send('Destroyed');
});

clientBlast.initialize();


clientBlast.on('loading_screen', (percent, message) => {
    io.emit("wa_blast_log", `${now} : Loading ${percent}% ${message}`);
});

clientBlast.on('qr', qr => {
    QRCode.toString(qr,{type:'terminal'}, function (err, url) {
        QRCode.toDataURL(qr, function (err, url) {
            io.emit("wa_blast_qr", url);
            io.emit('wa_blast_log', `QR Code received`);
        })
      })
});

clientBlast.on('ready', () => {
    io.emit("wa_blast_log", `${now} : WhatsApp is ready!`);
});

clientBlast.on('authenticated', () => {
    io.emit("wa_blast_log", `${now} : Whatsapp is authenticated!`);
});

clientBlast.on('auth_failure', function(session) {
    io.emit('wa_blast_log', `${now} : Auth failure, restarting...`);
});

clientBlast.on('disconnected', function() {
    clientBlast.destroy();
    clientBlast.initialize();
    return response.status(200).send('session destroyed');
  });

let download = function(uri, filename, callback){
    request.head(uri, function(err, res, body){
      request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
    });
    return response.status(200).send('request received');
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
    const registered =  await clientBlast.isRegisteredUser(number);
    if(!registered){
        return response.status(400).send('Invalid number');    
    }
    await download(attachmentUrl, attachmentName, function(){
    console.log('done');
    let attachment =  MessageMedia.fromFilePath(attachmentName);
    clientBlast.sendMessage(number, attachment,{caption:message});
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
    const registered =  await clientBlast.isRegisteredUser(number);
    if(!registered){
        return response.status(400).send('Invalid number');    
    }
    await clientBlast.sendMessage(number, message);
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
    const registered =  await clientBlast.isRegisteredUser(number);
    if(!registered){
        return response.status(400).send('Invalid number');    
    }
    
    const buttons_reply = new Buttons(message, buttons, title, footer)
    
    // send to number
    for (const component of [buttons_reply]) await clientBlast.sendMessage(number, component);

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
    const registered =  await clientBlast.isRegisteredUser(number);
    if(!registered){
        return response.status(400).send('Invalid number');    
    }

    const section = {
    title: title,
    rows: buttons
    };

    const list = new List(message, cta, [section], title, footer)
    await clientBlast.sendMessage(number, list);
    return response.status(200).send('message sended');
});


