const isAuth = require("../middleware/isAuth");
const express = require("express");
const { body } = require("express-validator");

const authController = require("../controllers/authController");
const router = express.Router();

router.post(
  "/signup",
  [
    body("username")
      .trim()
      .isLength({ min: 3 })
      .withMessage("Username must be at least 3 characters long"),
    body("password").notEmpty().withMessage("Password is required"),
    body("email").isEmail().withMessage("Please enter a valid email address"),
    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),
  ],
  authController.signup
);

router.put(
  "/signin",
  [
    body("username")
      .trim()
      .isLength({ min: 3 })
      .withMessage("Username must be at least 3 characters long"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  authController.signin
);

router.put(
  "/changeusername",
  isAuth,
  [
    body("newUsername")
      .trim()
      .isLength({ min: 3 })
      .withMessage("Username must be at least 3 characters long"),
  ],
  authController.changeUsername
);

router.put(
  "/resetPassword",
  isAuth,

  [body("email").isEmail().withMessage("Please enter a valid email address")],
  authController.resetPassword
);

router.put(
  "/newpassword/:token",
  [
    body("password").notEmpty().withMessage("Password is required"),
    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),
  ],
  authController.getNewPassword
);

router.get(
  "/verify/:token",
  [body("password").notEmpty().withMessage("Password is required")],
  authController.tokenVerify
);
module.exports = router;
