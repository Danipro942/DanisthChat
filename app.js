require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
const { Server } = require("socket.io");
const { createServer } = require("node:http");
const authRouter = require("./router/auth");
const userRouter = require("./router/user");

const imageRouter = require("./router/image");
const { errorHandler } = require("./middleware/errorHandler");
const socketHandler = require("./sockets/socketHandler");

const PORT = 3000;

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // O especifica el origen que necesites
    methods: ["GET", "POST"],
  },
});

socketHandler(io);

// Ensure the images directory exists
const imagesDir = path.join(__dirname, "images");
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir);
}

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);

    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/jpg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};
app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  cors({
    origin: "*", // Puedes restringir a un dominio específico aquí
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Serve static files from the "images" directory
app.use("/images", express.static(path.join(__dirname, "images")));

app.use(imageRouter);
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use(errorHandler);
mongoose
  .connect(
    `mongodb://${process.env.MONGO_KEY}@apirestp-shard-00-00.f0mla.mongodb.net:27017,apirestp-shard-00-01.f0mla.mongodb.net:27017,apirestp-shard-00-02.f0mla.mongodb.net:27017/groupchat?ssl=true&replicaSet=atlas-50f6oe-shard-0&authSource=admin&retryWrites=true&w=majority&appName=ApiRestP`
  )
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Sever Open on http://localhost:${PORT}/`);
    });
  })
  .catch((error) => {
    console.log("Something went wrong ", error);
  });
