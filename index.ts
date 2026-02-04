import express from "express";
import bodyParser from "body-parser";
const app = express();
import fs from "fs";
import { refundBot } from "./bot/refundBot";
import { loadHandler } from "./contract-services/events";
import https from "https";
import http from "http";
import comments from "./services/comments/index";
import "dotenv/config";

if (process.env.NODE_TEST == "false") {
  let key = "./keys/key.pem",
    cert = "./keys/star_bettery_io.crt",
    ca1 = "./keys/DigiCertCA.crt",
    ca2 = "./keys/My_CA_Bundle.crt",
    ca3 = "./keys/TrustedRoot.crt";

  var credentials = {
    key: fs.readFileSync(key, "utf8"),
    cert: fs.readFileSync(cert, "utf8"),
    ca: [
      fs.readFileSync(ca1, "utf8"),
      fs.readFileSync(ca2, "utf8"),
      fs.readFileSync(ca3, "utf8"),
    ],
  };

  var httpsServer = https.createServer(credentials, app);
  var io = require("socket.io")(httpsServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });
  comments(io);
  httpsServer.listen(443);
}

var cors = require("cors");

app.use(
  cors({
    origin: "*",
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.text({ limit: "50mb" }));
app.use(
  bodyParser.urlencoded({
    limit: "50mb",
    extended: true,
  }),
);
var httpServer = http.createServer(app);

if (process.env.NODE_TEST != "false") {
  var io = require("socket.io")(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });
  comments(io);
}

import Events from "./services/events";
Events(app);
import Funds from "./services/funds";
Funds(app);
import Users from "./services/users";
Users(app);
import Rooms from "./services/rooms";
Rooms(app);
import Subscribe from "./services/subscribe";
Subscribe(app);
import Image from "./services/image";
Image(app);
import TokenSale from "./contract-services/tokensale";
TokenSale(app);
import Public_bot from "./bot/public_bot";
Public_bot(app);
import Analytics from "./analytics";
Analytics(app);

httpServer.listen(3000, async () => {
  await loadHandler();
  setInterval(
    () => {
      refundBot();
    },
    1000 * 60 * 60 * 24 * 3,
  );

  console.log("server run port 3000");
});
