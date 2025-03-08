const User = require("../models/user");
const Chat = require("../models/chat");
const JWT = require("jsonwebtoken");
const cloudinary = require("../config/cloudinaryConfig");

const { validationResult } = require("express-validator");
const Message = require("../models/message");

exports.searchUser = async (req, res, next) => {
  const { search } = req.body;
  const { username } = req.user;
  const error = new Error();
  if (!search) {
    error.message = "A token is required";
    error.statusCode = 400;
    return next(error);
  }

  const findUser = await User.find({
    username: new RegExp(`^${search}`, "i"),
  }).select("username profilePicture -_id");
  const removeUserSelf = findUser.filter((user) => user.username !== username);
  res.status(200).json(removeUserSelf);
};

exports.createChat = async (req, res, next) => {
  const error = new Error();
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = Error("Validation Failed");
    error.statusCode = 422;
    return next(error);
  }

  const { username } = req.body;
  const { username: user } = req.user;
  try {
    const foundUser = await User.findOne({ username });

    if (!foundUser) {
      error.statusCode = 404;
      error.message = "This user doesn't exists";
      return next(error);
    }

    const verifyUser = await User.findOne({ username: user });

    if (!verifyUser) {
      error.statusCode = 404;
      error.message = "The user who made the request does not exist";
      return next(error);
    }

    let chat = await Chat.findOne({
      users: { $all: [verifyUser._id, foundUser._id] },
    }).populate("users");

    if (!chat) {
      chat = new Chat({ users: [verifyUser._id, foundUser._id] });
      await chat.save();
      const newChat = await Chat.findById(chat._id)
        .populate("users")
        .select("username lastMessage ");
      return res.status(202).json({
        chat: newChat,
      });
    }

    res.status(200).json({
      chat,
    });
  } catch (error) {
    console.log(error);

    next(error);
  }
};

exports.getChats = async (req, res, next) => {
  const error = new Error();

  const { _id, username } = req.user;
  const findUser = await User.findOne({ username });
  if (!findUser) {
    error.statusCode = 404;
    error.message = "This user doesn't exists";
    return next(error);
  }

  const chats = await Chat.find({ users: { _id } })
    .populate({
      path: "users",
      select: "username profilePicture createdAt -_id",
    })
    .select("username lastMessage");

  res.status(200).json({
    chats,
  });
};

exports.sendMessage = async (req, res, next) => {
  const error = new Error();
  const { receipterUser, text } = req.body;
  const { _id } = req.user;
  let imgURL;

  // Check if the image size exceeds 20MB
  const MAX_SIZE = 20 * 1024 * 1024; // 1MB in bytes

  if (req.file) {
    if (req.file.size > MAX_SIZE) {
      error.statusCode = 413;
      error.message = "Image size exceeds 20MB";
      return next(error);
    }
    const fileStr = req.file.buffer.toString("base64");
    const dataUri = `data:${req.file.mimetype};base64,${fileStr}`;
    try {
      const uploadResult = await cloudinary.uploader.upload(dataUri, {
        folder: "message_images",
      });
      imgURL = uploadResult.secure_url;
      console.log(imgURL);
    } catch (err) {
      console.log(err);
      error.statusCode = 500;
      error.message = "Error uploading image to Cloudinary";
      return next(error);
    }
  }
  try {
    const findReceipter = await User.findOne({ username: receipterUser });
    if (!findReceipter) {
      error.statusCode = 404;
      error.message = "This user doesn't exists";
      return next(error);
    }

    const findChat = await Chat.findOne({
      users: { $all: [findReceipter._id, _id] },
    });

    if (!findChat) {
      error.statusCode = 404;
      error.message = "This chat doesn't exists";
      return next(error);
    }
    console.log(findChat);
    const message = new Message({
      chatId: findChat._id,
      imgURL: imgURL,
      sender: _id,
      text,
    });

    console.log(message);
    const saveMessage = await message.save();
    res.status(202).json({
      mesage: "Sucessfull",
      saveMessage,
    });
  } catch (error) {
    console.log(error);
    return next(error);
  }
};

exports.getMessage = async (req, res, next) => {
  const error = new Error();
  const perPage = 20;
  let totalItems;
  const currentPage = req.params.page || 1;

  const { receipterUser } = req.params;

  const { _id, username } = req.user;
  try {
    const findReceipter = await User.findOne({ username: receipterUser });
    if (!findReceipter) {
      error.statusCode = 404;
      error.message = "This user doesn't exists";
      return next(error);
    }

    const findChat = await Chat.findOne({
      users: { $all: [findReceipter._id, _id] },
    });
    const countMessages = await Message.find({
      chatId: findChat._id,
    }).countDocuments();

    const messages = await Message.find({ chatId: findChat._id })
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * perPage)
      .limit(perPage);

    // I made this so the messages are in the correct order
    messages.reverse();

    // Calcula si hay más mensajes por cargar
    const hasMore = countMessages > currentPage * perPage;

    totalItems = countMessages;
    if (!messages) {
      error.statusCode = 404;
      error.message = "Message not found";
      return next(error);
    }
    res.status(200).json({
      messages,
      totalItems,
      hasMore,
    });
  } catch (error) {
    console.log(error);
    return next(error);
  }
};

exports.uploadProfileImage = async (req, res, next) => {
  console.log(req);
  const error = new Error();
  if (!req.file) {
    error.statusCode = 422;
    error.message = "No image provided";
    return next(error);
  }

  // Check if the image size exceeds 20MB
  const MAX_SIZE = 20 * 1024 * 1024; // 1MB in bytes
  if (req.file.size > MAX_SIZE) {
    error.statusCode = 413;
    error.message = "Image size exceeds 20MB";
    return next(error);
  }

  try {
    const fileStr = req.file.buffer.toString("base64");
    const dataUri = `data:${req.file.mimetype};base64,${fileStr}`;

    // Upload the image to Cloudinary

    const uploadResult = await cloudinary.uploader.upload(dataUri, {
      folder: "profile_pictures", // Opcional: carpeta para organizar las imágenes
    });

    // Get the URL of the uploaded image
    const imageUrl = uploadResult.secure_url;

    const uploadedImage = await User.findOneAndUpdate(
      { username: req.user.username },
      { profilePicture: imageUrl },
      { new: true }
    );

    const token = await JWT.sign(
      {
        username: uploadedImage.username,
        email: uploadedImage.email,
        profilePicture: uploadedImage.profilePicture,
        _id: uploadedImage._id,
      },
      process.env.JWT_KEY,
      { expiresIn: "24h" }
    );

    return res.status(201).json({
      imageUrl: uploadedImage.profilePicture,
      token,
      message: "Image uploaded successfully",
    });
  } catch (error) {
    console.log(error);
    return next(error);
  }
};
