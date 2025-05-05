

import express, { Request, Response } from "express";
import { waclient } from "../..";
import { ChatEithGemini } from "../AI/gemini";
import WAWebJS from "whatsapp-web.js";
export const sendWAMessageRouter = express.Router();


/**
 * @swagger
 * /send-message:
 *   post:
 *     summary: Send a message or media to a WhatsApp number
 *     tags:
 *       - Messaging
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - number
 *               - message
 *             properties:
 *               number:
 *                 type: string
 *                 example: 2348130882484
 *               message:
 *                 type: string
 *               mediaUrl:
 *                 type: string
 *                 
 *     responses:
 *       200:
 *         description: Message sent successfully
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Internal server error
 */

sendWAMessageRouter.post("/", async (req:any, res:any) => {
  const { number, message,type,useAi,mediaUrl } = req.body;

  if (!number || !message) {
    return res.status(400).json({ error: "Number and message are required" });
  }
 
  try {
    const sanitized_number = number.toString().replace(/[^0-9]/g, "")+"@c.us";  
    // console.log(getc.filter((id)=>id.id.server!=="c.us"))
    const number_details = await waclient.getNumberId(sanitized_number);
    
    if (!number_details) {
      return res.status(400).json({ error: "Number not registered" });
    }

    let send_message

    if(mediaUrl){
      const media = await WAWebJS.MessageMedia.fromUrl(mediaUrl);
      send_message= await waclient.sendMessage(number_details._serialized,message, {media});
    }else{
       send_message = await waclient.sendMessage(
        number_details._serialized,
        message,
      );
    }
    
    
    if (send_message) {
      return res.status(200).json({ message: "Message sent" });
    } else {
      return res.status(500).json({ error: "Message not sent" });
    }
  } catch (error:any) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error:"+error.message });
  }
});