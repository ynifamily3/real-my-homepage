"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const express_ejs_layouts_1 = __importDefault(require("express-ejs-layouts"));
require("dotenv/config");
const redis_1 = require("redis");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const app = (0, express_1.default)();
app.disable("x-powered-by");
const redisClient = (0, redis_1.createClient)({
    url: process.env.REDIS_URL,
});
redisClient.on("connect", () => {
    console.info("Redis connected!");
});
redisClient.on("error", (err) => console.log("Redis Client Error", err));
redisClient.connect().then();
// public dir
app.use(express_1.default.static(path_1.default.join(__dirname, "..", "/public")));
app.set("views", path_1.default.join(__dirname, "..", "/views"));
app.set("view engine", "ejs");
app.use(express_ejs_layouts_1.default);
app.set("layout", "layout"); // 'views/layout.ejs' 파일을 레이아웃으로 사용
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
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
    const clientId = process.env.NAVER_CLIENT_ID;
    const clientSecret = process.env.NAVER_CLIENT_SECRET;
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
app.use((req, res, next) => {
    res.status(404).render("404", {
        title: "ᗜ•   ̯ •̥ ᗜ",
    });
});
app.listen(3000, () => {
    console.log("서버 실행 중: http://localhost:3000");
});
exports.default = app;
