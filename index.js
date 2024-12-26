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
const model = genAI.getGenerativeModel({model: "gemini-2.0-flash-exp",});

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
    const prompt = `주유소 정보는 ${message}입니다.\n\n위의 주유소 가격과 거리 정보를 통해서 가장 기름넣으러가기 적절한 주유소를 추천해줘.\n\n답변 형태는 아래와 같이 답변해줘.\n\n1. 주유소 이름\n2. 가격 정보\n3. 거리 정보`;

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
