import express from "express";
import path from "path";
import expressLayouts from "express-ejs-layouts";
import "dotenv/config";
import { createClient } from "redis";
import cookieParser from "cookie-parser";

const app = express();

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
  console.log("쿠키?", req.cookies["count-checked"]);
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

app.use((req, res, next) => {
  res.status(404).render("404", {
    title: "ᗜ•   ̯ •̥ ᗜ",
  });
});

app.listen(3000, () => {
  console.log("서버 실행 중: http://localhost:3000");
});

export default app;
