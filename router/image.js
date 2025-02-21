const express = require("express");
const imageController = require("../controllers/imageController");

const router = express.Router();

router.post("/create-image", imageController.createImage);

module.exports = router;
