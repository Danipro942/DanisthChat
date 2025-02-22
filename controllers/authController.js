const { validationResult } = require("express-validator");
const User = require("../models/user");
const JWT = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const { json } = require("express");
const transporter = require("../config/nodemailer");
const { profile } = require("console");

exports.tokenVerify = async (req, res, next) => {
  const error = new Error();

  const { token } = req.params;
  if (!token) {
    error.statusCode = 404;
    error.message = "Token not found";
    return next(error);
  }

  try {
    const verify = await JWT.verify(token, process.env.JWT_KEY);
    if (!verify) {
      error.message = "Invalid Token";
      error.statusCode = 400;
      return next(error);
    }
    console.log(verify.username);
    const findUser = await User.findOne({ username: verify.username });

    if (!findUser) {
      error.message = "User not found";
      error.statusCode = 404;
      return next(error);
    }

    res.status(202).json({
      verifyToken: true,
    });
  } catch (error) {
    console.log(error);
    return res.status(404).json({
      verifyToken: false,
    });
  }
};

exports.signup = async (req, res, next) => {
  const error = new Error();
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = Error("Validation Failed");
    error.statusCode = 422;
    return next(error);
  }
  const { username, email, password } = req.body;
  try {
    const findUsername = await User.findOne({ username });
    console.log(req.params);

    if (findUsername) {
      error.statusCode = 409;
      error.message = "This username already exists";
      return next(error);
    }

    const findEmail = await User.findOne({ email });
    if (findEmail) {
      error.statusCode = 409;
      error.message = "This email already exists";
      return next(error);
    }

    const hashPw = await bcrypt.hash(password, 12);

    const user = new User({
      username,
      password: hashPw,
      email,
    });

    const userCreated = await user.save();

    const token = await JWT.sign(
      {
        username,
        email,
        _id: userCreated._id,
      },
      process.env.JWT_KEY,
      { expiresIn: "24h" }
    );

    res.status(200).json({
      message: "User created succesfully",
      token,
    });

    await transporter.sendMail({
      to: email,
      from: process.env.GMAIL_USER,
      subject: "SignUp Succeeded! Welcome To ChatConnect",
      html: `
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <!-- Cabecera -->
          <div style="background-color: #00d9ff; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: #ffffff; margin: 0;">¡Bienvenido a ChatConnect!</h1>
          </div>
          <!-- Cuerpo del mensaje -->
          <div style="padding: 30px;">
            <p style="color: #474747; font-size: 16px;">Hola <strong>${
              username || "Usuario"
            }</strong>,</p>
            <p style="color: #474747; font-size: 16px; line-height: 1.5;">
              Gracias por unirte a <strong>ChatConnect</strong>, la nueva red social donde podrás conversar, compartir y conectar con amigos y personas afines.
            </p>
            <p style="color: #474747; font-size: 16px;">Con ChatConnect, disfrutarás de:</p>
            <ul style="color: #474747; font-size: 16px; line-height: 1.6; margin-left: 20px;">
              <li>Chat en tiempo real con tus amigos y nuevos contactos.</li>
              <li>Publicar y compartir fotos, videos y tus pensamientos.</li>
              <li>Crear grupos y comunidades en torno a tus intereses.</li>
            </ul>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${[
                process.env.SERVER_HOST,
              ]}" style="background-color: #00d9ff; color: #ffffff; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Explora ChatConnect
              </a>
            </div>
            <p style="color: #474747; font-size: 16px;">
              Si tienes alguna pregunta o necesitas ayuda, contáctanos en 
              <a href="mailto:support@danisthProjects.com" style="color: #00d9ff; text-decoration: none;">
                support@danisthProjects.com
              </a>.
            </p>
          </div>
          <!-- Pie de página -->
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; border-radius: 0 0 10px 10px; font-size: 14px; color: #474747;">
            <p style="margin: 0;">ChatConnect - Conecta, comparte y conversa.</p>
          </div>
        </div>
      </body>
    </html>
  `,
    });
  } catch (error) {
    console.log(error);
    return next(error);
  }
};

exports.signin = async (req, res, next) => {
  const error = new Error();
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = Error("Validation Failed");
    error.statusCode = 422;
    return next(error);
  }

  const { username, password } = req.body;
  try {
    const findUser = await User.findOne({
      username: { $regex: new RegExp(`^${username}$`, "i") },
    });
    console.log(findUser);

    if (!findUser) {
      error.message = "Invalid email or password";
      error.statusCode = 401;
      return next(error);
    }

    const comparePw = await bcrypt.compare(password, findUser.password);
    if (!comparePw) {
      error.message = "Invalid email or password";
      error.statusCode = 401;
      return next(error);
    }

    const token = await JWT.sign(
      {
        username: findUser.username,
        email: findUser.email,
        profilePicture: findUser.profilePicture,
        _id: findUser._id,
      },
      process.env.JWT_KEY,
      { expiresIn: "24h" }
    );
    console.log();

    res.status(200).json({
      token,
    });
  } catch (error) {
    console.log(error);
    return next(error);
  }
};

exports.changeUsername = async (req, res, next) => {
  const error = new Error();
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = Error("Validation Failed");
    error.statusCode = 422;
    return next(error);
  }

  const { newUsername } = req.body;
  const { username } = req.user;
  console.log(req.user);

  try {
    const findUser = await User.findOne({ username });
    if (!findUser) {
      error.message = "The user dosent exists";
      error.statusCode = 404;
    }

    findUser.username = newUsername;

    const newUser = await findUser.save();
    res.status(202).json({
      newUser,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  const { email: emailBody } = req.body;
  console.log(emailBody);
  const error = new Error();
  let token;
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      error.statusCode = 500;
      error.message = "Something Went wrong restaring password";
      return next(error);
    }

    token = buffer.toString("hex");
  });

  try {
    const user = await User.findOne({ email: emailBody });
    if (!user) {
      return res.status(404).json({
        message: "No account with that email found ",
      });
    }
    user.resetToken = token;
    user.resetTokenExpiration = Date.now() + 600000; // 10 minutes
    await user.save();
    const sendingMail = await transporter.sendMail({
      to: emailBody,
      from: process.env.GMAIL_USER,
      subject: "Password Reset Request",
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px; border-radius: 8px; max-width: 600px; margin: auto; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; padding-bottom: 20px;">
            <h1 style="color: #FF5722; font-size: 28px;">Password Reset Request</h1>
            <p style="font-size: 16px; color: #555;">Hello ${
              user.username || "User"
            },</p>
            <p style="font-size: 16px; color: #555;">We received a request to reset your password. If you made this request, please click the link below. The link will expire in <strong>10 minutes</strong>.</p>
          </div>
          <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #ddd; text-align: center;">
            <p style="margin: 20px 0; color: #555;">Click the button below to reset your password:</p>
            <a href="${[
              process.env.SERVER_HOST,
            ]}/auth/new-password/${token}" style="display: inline-block; background-color: #FF5722; color: #ffffff; padding: 10px 20px; border-radius: 5px; text-decoration: none; font-weight: bold;">Reset Password</a>
            <p style="margin-top: 20px; font-size: 14px; color: #999;">If you didn’t request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
          </div>
          <footer style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p style="margin: 0;">Need help? Contact us at <a href="mailto:support@danisthProjects.com" style="color: #FF5722;">support@danisthProjects.com</a>.</p>
            <p style="margin: 5px 0; font-style: italic;">- The TODO Task Team</p>
          </footer>
        </div>
      `,
    });
    console.log(sendingMail);
    res.status(202).json({
      message: "Please check your email to reset the password",
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

exports.getNewPassword = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = Error("Validation Failed");
    error.statusCode = 422;
    return next(error);
  }
  const { token } = req.params;
  const { password } = req.body;
  const error = new Error();
  if (!token) {
    error.message = "A token is required";
    error.statusCode = 400;
    return next(error);
  }
  try {
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiration: { $gt: Date.now() },
    });
    if (!user) {
      error.message = "Token Invalid";
      error.statusCode = 400;
      return next(error);
    }

    const newPassword = await bcrypt.hash(password, 12);
    user.password = newPassword;
    user.resetToken = "";
    user.resetTokenExpiration = Date.now();
    await user.save();
    res.status(202).json({
      message: "Password Changed Sucessfully",
    });
  } catch (error) {}
};
