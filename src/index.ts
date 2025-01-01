import express from "express";
import path from "path";

const app = express();

const __dirname = path.resolve();
// public dir
app.use(express.static(__dirname + "/public"));
app.set("views", __dirname + "/views");
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

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
  console.log("Server is running on http://localhost:3000");
});

console.log(process.env.HELLO);
