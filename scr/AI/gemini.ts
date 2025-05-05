import { Content, GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const messages = [] as Content[];

const API_KEY =
  process.env.GEMINIAPI_KEY ;

const genAI = new GoogleGenerativeAI(API_KEY!);

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export const ChatEithGemini = async (payload: { message: string }) => {
  let { message } = payload;
  message = message.replace(/\t/g, "").replace(/[\.,!:"'/\\]/g, "");
  messages.push({parts:[{text:message}],role:"user"})
  try {
    const chat = model.startChat({
      systemInstruction: {
        role: "system",
        parts: [{
          text: ``
        }]
      },
      history: messages,
    });

    const result = await chat.sendMessage(message);
    console.log(result.response.text());
    // Client.sendMessage(message1.from, result.response.text());
  } catch (error) {
    console.log(error);
  }
};
