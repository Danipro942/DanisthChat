const express = require("express");
const { body } = require("express-validator");
const UserController = require("../controllers/userController");
const isAuth = require("../middleware/isAuth");
const multer = require("multer");
const path = require("path");

const router = express.Router();

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/jpg"
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only PNG, JPEG, and JPG files are allowed."
      ),
      false
    );
  }
};

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },

  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);

    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});
const storage = multer.memoryStorage();

const upload = multer({ storage, fileFilter });
// const upload = multer({ storage: fileStorage, fileFilter: fileFilter });

console.log(upload);
router.post(
  "/searchuser",
  isAuth,
  [
    body("search")
      .trim()
      .isLength({ min: 3 })
      .withMessage("Username must be at least 3 characters long"),
  ],
  UserController.searchUser
);

router.put(
  "/chat",
  isAuth,
  [
    body("username")
      .trim()
      .isLength({ min: 3 })
      .withMessage("Username must be at least 3 characters long"),
  ],
  UserController.createChat
);

router.get("/chats", isAuth, UserController.getChats);

router.post(
  "/message",
  isAuth,
  [
    body("receipterUser")
      .trim()
      .isLength({ min: 3 })
      .withMessage("Username must be at least 3 characters long"),
    body("text")
      .trim()
      .isLength({ min: 1 })
      .withMessage("text must be at least 3 characters long"),
  ],
  upload.single("image"),
  UserController.sendMessage
);

router.get(
  "/messages/:receipterUser/:page?",
  isAuth,
  UserController.getMessage
);

router.post(
  "/profilepicture",
  isAuth,
  upload.single("image"),
  UserController.uploadProfileImage
);

module.exports = router;
