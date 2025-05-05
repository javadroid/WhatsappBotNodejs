import express, { Express, Request, Response } from "express";
import { Client, LocalAuth, RemoteAuth } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import qrcode1 from "qrcode";

import { config } from "dotenv";
import { sendWAMessageRouter } from "./scr/whatsapp/send-messages";
import { swaggerUi, swaggerSpec } from "./swagger/swagger";
// import { handleMessage } from "./src/handlers/messageHandler";
// import { handleGroupJoin } from "./src/handlers/groupJoinHandler";
// import { handleGroupLeave } from "./src/handlers/groupLeaveHandler";
import { MongoStore } from "wwebjs-mongo";
import mongoose from "mongoose";
config();

const app: Express = express();
const port = process.env.PORT || 3000;
let qrcodeURl = "";
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

export let waclient: Client;

const { MONGODB_URL, environment } = process.env;
const DBLINK =
  environment === 'production'
    ? MONGODB_URL
    : 'mongodb://localhost:27017/goveloox';
mongoose.connect(DBLINK!).then(() => {
  const store = new MongoStore({ mongoose: mongoose });
  waclient = new Client({
    authStrategy: new RemoteAuth({
      store: store,
      // clientId:"",
      backupSyncIntervalMs: 300000,
    }),
    //   webVersionCache: {
    //     type: "remote",
    //     remotePath: `https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2407.3.html`,
    //   },
    puppeteer: {
      // executablePath: "./Application/chrome.exe",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      headless: true,
    },
  });

  waclient.on("qr", (qr: string) => {
    console.log("QR RECEIVED", qr);
    qrcode.generate(qr, { small: true }, (c) => console.log(c));
    qrcode1.toDataURL(qr, (err: any, url: any) => {
      if (err) {
        console.error(err);
      } else {
        qrcodeURl = url;
      }
    });
  });

  waclient.on("ready", () => {
    console.log("Client is ready!");
  });

  waclient.on("message", async (msg) => {
    //   await handleMessage(msg, waclient);
  });

  waclient.on("group_join", async (notification) => {
    //   await handleGroupJoin(notification, waclient);
  });

  waclient.on("group_leave", async (notification) => {
    //   await handleGroupLeave(notification, waclient);
  });
  waclient.on("disconnected", (reason) => {
    console.log("Disconnected due to:", reason);
    waclient.initialize(); // careful to avoid infinite loops
  });

  waclient.on("authenticated", () => {
    console.log("AUTHENTICATED");
  });

  waclient.on("auth_failure", (msg) => {
    console.error("AUTHENTICATION FAILURE", msg);
  });

  waclient.initialize();
  app.use((req, res, next) => {
    console.log("Incoming:", req.method, req.url, req.headers["content-type"]);
    next();
  });
  app.get("/", (req: Request, res: Response) => {
    res.send("WhatsApp Bot is running!");
  });

  // swaager for /qr

  /**
   * @swagger
   * /qr:
   *   get:
   *     summary: Get WhatsApp QR Code
   *     description: Returns an HTML page containing the QR code image to scan with WhatsApp.
   *     tags:
   *       - WhatsApp
   *     responses:
   *       200:
   *         description: HTML with QR Code
   *         content:
   *           text/html:
   *             schema:
   *               type: string
   *               example: "<html><body><img src='data:image/png;base64,...' /></body></html>"
   */
  app.get("/qr", async (req: any, res: any) => {
    const acceptHeader = req.headers["accept"] || "";
    const userAgent = req.headers["user-agent"] || "";

    const isBrowser = acceptHeader !== "text/html";

    if (isBrowser) {
      res.send(`
        <html>
          <head>
            <title>WhatsApp QR</title>
            <style>
              body {
                font-family: sans-serif;
                text-align: center;
                padding-top: 50px;
              }
              #qr {
                margin-top: 20px;
              }
            </style>
            <script>
 let counter = 5;
 let dataaa
            
              async function fetchQR() {
             
                
                try {
                  const response = await fetch("/qr-image");
                  if (response.status === 204) {
                    document.getElementById("status").textContent = "Waiting for QR code...";
                    return;
                  }
    
                  const data = await response.json();
                  document.getElementById("qr").src = data.qr;
                  if(dataaa!==data.qr){
                     document.getElementById("checknew").textContent = "New";
                  }else{
  document.getElementById("checknew").textContent = "Old";
                  }
                  dataaa=data.qr
                  console.log(data.qr);
                  document.getElementById("status").textContent = "Scan this QR code with WhatsApp:";
                } catch (err) {
                  document.getElementById("status").textContent = "Error fetching QR code";
                  console.error(err);
                }
              }
            

                function updateCounter() {
        document.getElementById("counter").textContent = "Refreshing in:"+ counter;
        if (counter > 0) {
          counter--;
        } else {
         counter=10
          fetchQR(); // Refresh the QR code when counter hits 0
        }
      }
    setInterval(updateCounter, 1000);
              window.onload = fetchQR;
            </script>
          </head>
          <body>
            <h1 id="status">Loading QR...</h1>
            <div> <img id="qr" alt="QR Code will appear here" /></div>
                  <div id="checknew">New</div>
            <div id="counter">Refreshing in: 5s</div>
          </body>
        </html>
      `);
    } else {
      // Respond with the raw image data (optional: convert base64 to Buffer)
      if (qrcodeURl === "") {
        return res.status(204).send("QR code not yet available");
      } else {
        const base64Data = qrcodeURl.replace(/^data:image\/png;base64,/, "");
        const imgBuffer = Buffer.from(base64Data, "base64");

        res.writeHead(200, {
          "Content-Type": "image/png",
          "Content-Length": imgBuffer.length,
        });
        res.end(imgBuffer);
      }
    }
  });
  app.get("/qr-image", (req: any, res: any) => {
    if (!qrcodeURl) {
      return res.status(204).send(); // No content yet
    }

    res.json({ qr: qrcodeURl });
  });

  /**
   * @swagger
   * /session-status:
   *   get:
   *     summary: Check WhatsApp session status
   *     description: Returns whether a WhatsApp session is active or not.
   *     tags:
   *       - WhatsApp
   *     responses:
   *       200:
   *         description: Session is active
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: connected
   *                 number:
   *                   type: string
   *                   example: "1234567890"
   *                 platform:
   *                   type: string
   *                   example: Android
   *       404:
   *         description: Session is not active
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: no connected device
   */
  app.get("/session-status", async (req: Request, res: Response) => {
    try {
      const isReady = waclient.info && waclient.info.wid;
      if (isReady) {
        res.status(200).json({
          status: "connected",
          number: waclient.info.wid.user,
          platform: waclient.info.platform,
        });
      } else {
        res.status(404).json({ status: "no connected device" });
      }
    } catch (error) {
      console.error("Session status check error:", error);
      res.status(500).json({ error: "Unable to determine session status" });
    }
  });

  //add routes
  app.use("/send-message", sendWAMessageRouter);

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });
});
