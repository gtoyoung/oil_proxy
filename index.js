import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import request from "request";
dotenv.config();

const PORT = process.env.PORT || 80;
const OIL_CODE = process.env.OIL_CODE;
const app = express();

const corsOptions = {
  origin: process.env.TARGET_URL,
};

app.use(cors(corsOptions));
app.use(express.json({ extended: true }));

app.get("/getTop20", function (req, res) {
  const areaCd = req.param("area");
  const oliType = req.param("oilType");
  const url = `https://www.opinet.co.kr/api/lowTop10.do?out=json&code=${OIL_CODE}&prodcd=${oliType}&area=${areaCd}&cnt=20`;

  request(url, function (error, response, body) {
    res.send(body);
  });
});

app.get("/", function (req, res) {
  res.send("welcome");
});

app.listen(PORT, function () {
  console.log(`Server is running on ${PORT}`);
});
