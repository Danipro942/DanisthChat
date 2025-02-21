const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ChatSchema = new Schema(
  {
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    lastMessage: {
      type: String,
    },
  },
  { timestamps: true } // Agrega `createdAt` y `updatedAt`
);

module.exports = mongoose.model("Chat", ChatSchema);

// // lastMessage: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Message",
//     },
