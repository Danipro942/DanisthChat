const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465, // El puerto correcto para Gmail es 465 para conexiones seguras
  secure: true, // true para conexiones seguras (SSL/TLS)
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

const verifyTransporter = async () => {
  try {
    await transporter.verify();
    console.log("Mail transporter verified successfully");
  } catch (error) {
    console.log("Something went wrong verifying the mail transporter", error);
  }
};

verifyTransporter();

module.exports = transporter;
