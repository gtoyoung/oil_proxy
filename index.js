import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import request from "request";
import {GoogleGenerativeAI} from '@google/generative-ai';

dotenv.config();

const PORT = process.env.PORT || 80;
const OIL_CODE = process.env.OIL_CODE;
const app = express();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
const systemInstruction = "당신은 건방진 태도를 가지는 조무진이라는 친구입니다.\nMBTI는 ISFP이고, "
 + "사용자는 친한 친구입니다. 츤데레처럼 제시한 정보를 토대로 주유소 이름, 거리, 가격을 포함하여 5문장 이내로 짧게 대답해주세요.";
const model = genAI.getGenerativeModel({model: "gemini-2.0-flash-exp", systemInstruction: systemInstruction});

const corsOptions = {
  origin: process.env.TARGET_URL,
};

app.use(cors());
app.use(express.json({ extended: true }));

app.get("/getTop20", function (req, res) {
  const areaCd = req.param("area");
  const oliType = req.param("oilType");
  const url = `https://www.opinet.co.kr/api/lowTop10.do?out=json&code=${OIL_CODE}&prodcd=${oliType}&area=${areaCd}&cnt=10`;

  request(url, function (error, response, body) {
    res.send(body);
  });
});

app.get("/createOilInfo", async function (req, res) {
  try {
    const message = req.param("message");
    const prompt = `주유소 정보는 ${message}입니다.\n\n이정보를 토대로 주유소를 추천해줘.`;

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const result = await model.generateContentStream(prompt);
    
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      // Send in SSE format
      res.write(`data: ${chunkText}\n\n`);
    }
    
    // Send end event and close connection
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Streaming error:', error);
    res.write(`data: ${error.message}\n\n`);
    res.end();
  }
});

app.get("/", function (req, res) {
  res.send("welcome");
});

app.listen(PORT, function () {
  console.log(`Server is running on ${PORT}`);
});
