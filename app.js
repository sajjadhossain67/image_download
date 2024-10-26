const express = require("express");
const axios = require("axios");
const sharp = require("sharp");
const fs = require("fs");
const cors = require("cors");
const path = require("path");

const generateImage = require("./image");

const app = express();
app.use(cors());
app.use(express.json());

// Middleware to validate required query parameters
function validateQueryParams(req, res, next) {
  if (!req.query.img) {
    return res.status(400).send("Image URL is required.");
  }
  next();
}

app.get("/download-image", validateQueryParams, async (req, res) => {
  try {
    const imageUrl = req.query.img;
    const title = req.query.title || "Default Title";

    const outputFilePath = path.join(__dirname, "output-image.png");

    // Generate the image with the specified title
    await generateImage(imageUrl, title, outputFilePath);

    // Send the image file as a download response
    res.download(outputFilePath, (err) => {
      if (err) {
        console.error("Error sending file:", err);
        res.status(500).send("Failed to download image.");
      }

      // Delete the file after sending it
      fs.unlink(outputFilePath, (deleteErr) => {
        if (deleteErr) {
          console.error("Error deleting file:", deleteErr);
        } else {
          console.log("File deleted successfully.");
        }
      });
    });
  } catch (err) {
    console.error("Error in API:", err);
    res.status(500).send("An error occurred.");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
