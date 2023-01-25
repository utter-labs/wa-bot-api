
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
  console.log(socket.id);
});

server.listen(port, () => {
  console.log(`Now listening on port ${port}`); 
});

