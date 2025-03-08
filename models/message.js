const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const MessageSchema = new Schema(
  {
    chatId: {
      required: true,
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
    },

    sender: {
      required: true,
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    imgURL: {
      type: String,
      required: false,
    },

    text: {
      type: String,
      required: true,
    },
  },
  { timestamps: true } // Agrega `createdAt` y `updatedAt`
);
module.exports = mongoose.model("Message", MessageSchema);
