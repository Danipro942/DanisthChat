const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    profilePicture: {
      type: String,
      required: true,
      default:
        "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png",
    },

    password: {
      type: String,
      required: true,
    },
    resetToken: String,
    resetTokenExpiration: Date,
  },
  { timestamps: true } // Agrega `createdAt` y `updatedAt`
);

module.exports = mongoose.model("User", userSchema);
