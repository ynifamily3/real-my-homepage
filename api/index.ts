import express from "express";
import path from "path";
import "dotenv/config";

const app = express();

// public dir
app.use(express.static(path.join(__dirname, "..", "/public")));
app.set("views", path.join(__dirname, "..", "/views"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

app.get("/test", (req, res) => {
  res.send(`Express on Vercel: ${process.env.HELLO}`);
});

app.get("/form", (req, res) => {
  const userName = req.query.name || "손님";
  res.render("form", { userName });
});

app.post("/form", (req, res) => {
  // post 요청을 받았을 때 처리하는 부분
  console.log(req);
  const userName = req.body.userName || "손님";
  const userPassword = req.body.userPassword;
  const userPasswordConfirm = req.body.userPasswordConfirm;
  const userEmail = req.body.userEmail;
  res.render("form_result", {
    userName,
    userPassword,
    userPasswordConfirm,
    userEmail,
  });
});

app.use((req, res, next) => {
  res.status(404).render("404");
});

app.listen(3000, () => {
  console.log("Server ready on port 3000.");
});

export default app;
