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
  const url = `https://www.opinet.co.kr/api/lowTop10.do?out=json&code=${OIL_CODE}&prodcd=${oliType}&area=${areaCd}&cnt=20`;

  request(url, function (error, response, body) {
    res.send(body);
  });
});

app.get("/createOilInfo", async function (req, res) {
  try {
    const message = req.param("message");
    const prompt = `정보 : ${message} \n\n [위의 정보를 토대로 가장 효율적인 주유소를 추천해주는데 잡다한 설명은 필요없고 그냥 1위부터 3위까지 간단히 도식화하듯이 표현해줘]`;
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
