exports.createImage = (req, res, next) => {
  console.log(req.file);
  const error = new Error();
  if (!req.file) {
    error.statusCode = 422;
    error.message = "No image provided";

    throw error;
  }

  const imageUrl = `${req.protocol}://${req.get('host')}/${req.file.path.replace(/\\/g, '/')}`;
  res.status(201).json({
    message: "Image uploaded",
    imageUrl: imageUrl,
  });

};
