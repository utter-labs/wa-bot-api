
const express = require('express');
const bodyParser = require('body-parser');
const { Client, MessageMedia, List, Buttons, LocalAuth } = require('whatsapp-web.js');  
const fs = require('fs');
const app = express();
const cors = require('cors')
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const port = 5100;
const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:5100'
// socket
const server = require("http").createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;
const moment = require('moment-timezone');
moment.tz.setDefault('Asia/Jakarta');

const myFormat = printf(({ level, message, label, timestamp }) => {
  const timestampJakarta = moment(timestamp).format('YYYY-MM-DD HH:mm:ss');
  return `${timestampJakarta} | ${level.toUpperCase()} | ${message}`;
});

const logger = createLogger({
    format: combine(
      timestamp(),
      myFormat
    ),
    transports: [
        new transports.File({ filename: 'log/info.log', level: 'silly' })
    ],
});

// socket Router
function SocketRouter(io) {
  const router = express.Router();

  return router;
}

const socketRouter = SocketRouter(io)
app.use(cors())
app.use("/", socketRouter);
app.set("view engine", "ejs");
app.use(express.static('public'))


let today  = new Date();
let now = today.toLocaleString();
eval(fs.readFileSync('app/blast.js')+'');

// socket connection
io.on("connection", (socket) => {
  logger.info("WEB SOCKET CONNECTION | New client web socket connected " + socket.id);
  console.log(socket.id);
  fs.readFile('qrCode.txt', 'utf8', function (err, data) {
    if (err) logger.error("QR CODE | Error read local QA code " + err);
    // Send QR Code to client
    io.emit("wa_blast_qr", data);
  });
});

setInterval(() => {
  fs.readFile('log/info.log', 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return;
    }
    const lines = data.trim().split('\n');
    const logs = lines
      .map(line => {
        const [timestamp, level, group, message] = line.split(' | ');
        return { timestamp, level, group, message };
      })
      .filter(log => {
        const today = moment().format('YYYY-MM-DD');
        return log.timestamp.startsWith(today) && log.group.toUpperCase() !== 'WEB SOCKET CONNECTION';
      })
      .sort((a, b) => {
        return b.timestamp.localeCompare(a.timestamp);
      })
      .slice(0, 100);
    io.emit('log', logs);
  });
}, 1000);

server.listen(port, () => {
  console.log(`Now listening on port ${port}`); 
});

