let QRCode = require('qrcode')
const { Client, MessageMedia, List, Buttons, LocalAuth } = require('whatsapp-web.js');
const multer = require('multer');
const request = require('request');
const fs = require('fs');
const path = require('path');
let qr = ''

const clientBlast = new Client({
    authStrategy: new LocalAuth({ clientId: "client-blast" }),
    puppeteer: { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] },
});

app.get('/log', multer().any(), async (request, response) => {
    return response.sendFile(path.join(__dirname, 'src/qr.html'));
});


// This code is used to get the connection status of the client.
// The connection status is used to determine if the client is connected to the server.
// If the connection status is true, the client is connected to the server.
// If the connection status is false, the client is not connected to the server.
// The connection status is stored in the variable 'connection'.
// The connection status is returned to the user.
app.get('/connection', multer().any(), async (request, response) => {
    connection = ''
    clientBlast.getState().then((data) => {
        return response.status(200).json({ connection: data });
    });
});


/**
 * Destroy session-client-blast
 */
app.get('/destroy', multer().any(), async (request, response) => {
    const dir = '.wwebjs_auth/session-client-blast'
    await fs.rm(dir, { recursive: true, force: true }, err => {
        if (err) {
            throw err
        }

        console.log(`${dir} is deleted!`)
    })
    logger.warn("WA SESSION | Wa session destroyed");
    clientBlast.destroy();
    clientBlast.initialize();
    return response.status(200).send('Destroyed');
});

// Initialize the client blast.
clientBlast.initialize();

// Listen for QR Code
clientBlast.on('qr', qr => {
    // Convert QR Code to string
    QRCode.toString(qr, { type: 'terminal' }, function (err, url) {
        // Convert QR Code to dataURL
        QRCode.toDataURL(qr, function (err, url) {
            // Save QR Code to file
            fs.writeFile('qrCode.txt', url, function (err) {
                if (err) throw err;
                console.log('QR Code saved to file');
            });
            // Send QR Code to client
            io.emit("wa_blast_qr", url);
            // Log QR Code received
            io.emit('wa_blast_log', `QR Code received`);
            logger.info("QR CODE | New QR Code received");
        });
    });
});
// When the client receives the loading_screen event, emit a socket message
// with the data it receives from the clientBlast loading_screen event
clientBlast.on('loading_screen', (percent, message) => {
    io.emit("wa_blast_log", `${now} : Loading ${percent}% ${message}`);
});

// Code that listens for a ready event from the WhatsApp client, and sends a message to the client to log the event to the client.
clientBlast.on('ready', () => {
    logger.info("WA SESSION | Connected to WhatsApp");
    io.emit("wa_blast_log", `${now} : WhatsApp is ready!`);
});

// Code that listens for an authenticated event from the WhatsApp client, and sends a message to the client to log the event to the client.
clientBlast.on('authenticated', () => {
    logger.info("WA SESSION | WhatsApp is authenticated!");
    io.emit("wa_blast_log", `${now} : Whatsapp is authenticated!`);
});

// Code that listens for an auth_failure event from the WhatsApp client, and sends a message to the client to log the event to the client.
clientBlast.on('auth_failure', function (session) {
    logger.error("WA SESSION | Auth failure, restarting...");
    io.emit('wa_blast_log', `${now} : Auth failure, restarting...`);
});

clientBlast.on('disconnected', function () {
    logger.error("WA SESSION | Disconnected, Please login again");
    clientBlast.destroy();
    clientBlast.initialize();
    return response.status(200).send('session destroyed');
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
    
    try {
        if (phoneNumber === 'status@broadcast') {
            return response.status(200).send('brodcast received');
        }
        // check for number in request
        if (!phoneNumber) {
            return response.status(400).send('Number not found');
        }
        number = phoneNumber.includes('@c.us') ? phoneNumber : `${phoneNumber}@c.us`;
        // check for is number is registered
        const registered = await clientBlast.isRegisteredUser(number);
        if (!registered) {
            return response.status(400).send('Invalid number');
        }
        await clientBlast.sendMessage(number, message);
        return response.status(200).send('message sended');
    } catch (error) {
        logger.error("SEND MESSAGE | Error : " + error, phoneNumber + " | " + message );
        return response.status(500).send('error');
    }
    
});
