const Chat = require("../models/chat");
const User = require("../models/user");

module.exports = async (io) => {
  io.on("connection", (socket) => {
    socket.on("login", (username) => {
      socket.username = username;

      socket.join(username);
      console.log(`User ${username} with ID ${socket.id} connected`);
    });

    socket.on("private_message", async ({ to, message, sender }) => {
      console.log("Message Reveived: ", message, to);

      if (to) io.to(to).emit("messageReveived", { text: message, sender });
      try {
        const findUser = await User.findOne({ username: to });
        const findSender = await User.findOne({ username: sender });

        const findChat = await Chat.findOne({
          users: { $all: [findUser._id, findSender._id] },
        });

        findChat.lastMessage = message.replace(/(\r\n|\n|\r)/g, " ");
        await findChat.save();
        if (to)
          io.to(to)
            .to(sender)
            .emit("lastMessage", { message, _id: findChat._id });
        console.log("lastMessage");
      } catch (error) {
        console.log(error);
      }
    });

    console.log("User Connected ID ", socket.id);
  });
};
