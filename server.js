const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const http = require("http");
const socketIO = require("socket.io");
const User = require("./models/User");
const Post = require("./models/Post");

// ---------- APP ----------
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: { origin: "*" }
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// ---------- MONGO ----------
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.error(err));

// ---------- CLOUDINARY ----------
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "safe_team_data",
    allowed_formats: ["jpg", "png", "jpeg"]
  }
});

const upload = multer({ storage });

// ---------- LOGIN ----------
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  if (!user) return res.json({ success: false });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.json({ success: false });

  res.json({ success: true });
});

// ---------- FIRST RUN: CREATE ADMIN ----------
app.get("/init", async (req, res) => {
  const hash = await bcrypt.hash("admin123", 10);

  await User.deleteMany({});
  await User.create({
    username: "admin",
    passwordHash: hash
  });

  res.send("Admin Created | username=admin password=admin123");
});

// ---------- FILE UPLOAD ----------
app.post("/upload", upload.single("image"), async (req, res) => {
  const post = await Post.create({
    message: req.body.message,
    image: req.file.path
  });

  io.emit("newPost", post);

  res.json({ status: "ok", post });
});

// ---------- SOCKET ----------
io.on("connection", () => {
  console.log("User Connected");
});

// ---------- RENDER PORT ----------
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log("Server running on port " + PORT));
