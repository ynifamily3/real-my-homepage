import express from "express";
import path from "path";
import expressLayouts from "express-ejs-layouts";
import "dotenv/config";
import { createClient } from "redis";
import cookieParser from "cookie-parser";
import { v4 as uuidv4 } from "uuid";
import { f2l } from "./passkey";

const app = express();
app.use(express.json());
app.disable("x-powered-by");

const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient.on("connect", () => {
  console.info("Redis connected!");
});
redisClient.on("error", (err) => console.log("Redis Client Error", err));
redisClient.connect().then();

// public dir
app.use(express.static(path.join(__dirname, "..", "/public")));
app.set("views", path.join(__dirname, "..", "/views"));
app.set("view engine", "ejs");
app.use(expressLayouts);
app.set("layout", "layout"); // 'views/layout.ejs' 파일을 레이아웃으로 사용

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", async (req, res) => {
  const count = Number(await redisClient.get("count")) || 0;

  if (!req.cookies["count-checked"]) {
    await redisClient.incr("count");
    res.cookie("count-checked", "true", {
      maxAge: 86400 * 1000, // 1 day
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  }
  res.render("home", {
    title: "",
    count: count.toLocaleString("ko-KR"),
  });
});

app.get("/couont", async (req, res) => {
  const count = Number(await redisClient.get("count")) || 0;
  if (!req.cookies["count-checked"]) {
    await redisClient.incr("count");
    res.cookie("count-checked", "true", {
      maxAge: 86400 * 1000, // 1 day
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  }
  res.render("count", {
    title: "카운터 - " + count,
    count: count.toLocaleString("ko-KR"),
  });
});

app.get("/form", (req, res) => {
  const userName = req.query.name || "손님";
  res.render("form", { title: "폼 전송", userName });
});

app.post("/form", (req, res) => {
  // post 요청을 받았을 때 처리하는 부분
  console.log(req);
  const userName = req.body.userName || "손님";
  const userPassword = req.body.userPassword;
  const userPasswordConfirm = req.body.userPasswordConfirm;
  const userEmail = req.body.userEmail;
  res.render("form_result", {
    title: "폼 전송 결과",
    userName,
    userPassword,
    userPasswordConfirm,
    userEmail,
  });
});

app.get("/map", (req, res) => {
  res.render("map", {
    title: "지도",
  });
});

app.get("/login.php", (req, res) => {
  const clientId = process.env.NAVER_CLIENT_ID;
  const redirectURI = `https://${req.get("host")}/login/callback/naver.jsp`;
  const state = crypto.randomUUID();
  const apiURL = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectURI}&state=${state}`;
  res.render("APIExamNaverLogin", {
    title: "네아로",
    apiURL,
  });
});

//
app.get("/login/callback/naver.jsp", async (req, res) => {
  const code = req.query.code;
  const state = req.query.state;
  const clientId = process.env.NAVER_CLIENT_ID!;
  const clientSecret = process.env.NAVER_CLIENT_SECRET!;
  const redirectUrl = encodeURIComponent(`https://${req.get("host")}/`);
  const api_url = `https://nid.naver.com/oauth2.0/token?grant_type=authorization_code&client_id=${clientId}&client_secret=${clientSecret}&redirect_uri=${redirectUrl}&code=${code}&state=${state}`;

  const result = await fetch(api_url, {
    headers: {
      "X-Naver-Client-Id": clientId,
      "X-Naver-Client-Secret": clientSecret,
    },
  }).then((res) => res.json());

  res.render("APIExamNaverCallback", {
    title: "네아로 콜백",
    result: JSON.stringify(result, null, 2),
  });
});

app.get("/a", (req, res) => {
  res.render("vt_a", {
    title: "a",
  });
});

app.get("/b", (req, res) => {
  // cookie x, y
  const _x = req.cookies["x"];
  const _y = req.cookies["y"];
  const x = _x ? _x + "px" : "50vw";
  const y = _y ? _y + "px" : "50vh";
  res.render("vt_b", {
    title: "b",
    x: x,
    y: y,
  });
});

app.get("/cgi-bin/passkey.cgi", (req, res) => {
  res.render("passkey", {
    title: "패스키 로그인",
  });
});

// Uint8Array → Base64 (서버에서 클라이언트로 전송)
function uint8ArrayToBase64(buffer: ArrayBuffer) {
  return Buffer.from(buffer).toString("base64");
}

app.post("/cgi-bin/register-challenge.cgi", async (req, res) => {
  const { username } = req.body;
  if (!username) {
    res.status(400).json({ error: "사용자 이름이 필요합니다." });
    return;
  }

  const userId = uuidv4();
  const challenge = await f2l.attestationOptions();
  challenge.user.id = new TextEncoder().encode(userId);
  challenge.user.name = username;
  challenge.user.displayName = username;

  const result = {
    ...challenge,
    challenge: uint8ArrayToBase64(challenge.challenge),
  };

  await redisClient.set(`user:${username}:challenge`, JSON.stringify(result));
  await redisClient.set(`user:${username}:id`, userId);

  res.json(result);
});

app.post("/cgi-bin/register.cgi", async (req, res) => {
  const { username, id, response } = req.body;
  if (!username || !id || !response) {
    res.status(400).json({ error: "필요한 정보가 없습니다." });
    return;
  }

  const challengeData = await redisClient.get(`user:${username}:challenge`);
  if (!challengeData) {
    res.status(400).json({ error: "challenge 없음" });
    return;
  }
  const expectedChallenge = JSON.parse(challengeData);

  const attestation = f2l.attestationResult(response, {
    challenge: expectedChallenge.challenge,
  } as any);

  await redisClient.set(
    `user:${username}:credential`,
    JSON.stringify((await attestation).authnrData)
  );

  res.json({
    success: true,
    test: JSON.stringify((await attestation).authnrData),
  });
});

app.use((req, res, next) => {
  res.status(404).render("404", {
    title: "ᗜ•   ̯ •̥ ᗜ",
  });
});

app.listen(3000, () => {
  console.log("서버 실행 중: http://localhost:3000");
});

export default app;
