const sharp = require("sharp");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

// Utility function to fetch the image from a URL
async function fetchImage(url) {
  const response = await axios.get(url, { responseType: "arraybuffer" });
  return Buffer.from(response.data, "binary");
}

// Function to split title text into two lines if it's too long
function splitTitleToFit(title, maxLineLength) {
  const words = title.split(" ");
  let line1 = "";
  let line2 = "";

  for (let word of words) {
    if ((line1 + word).length <= maxLineLength) {
      line1 += word + " ";
    } else {
      line2 += word + " ";
    }
  }

  return [line1.trim(), line2.trim()];
}

// Main function to create an image with a title, template, and image from URL
async function generateImage(imageUrl, title, outputFilePath) {
  try {
    const canvasWidth = 1200;
    const canvasHeight = 1200;

    // Load your background template
    const templateImagePath = path.join(__dirname, "template.jpg"); // Replace with your template path

    // Fetch image from URL
    const imageBuffer = await fetchImage(imageUrl);

    // Define the image height (70% of canvas height)
    const imageHeight = Math.round(canvasHeight * 0.7);
    const imageWidth = canvasWidth; // The image will cover the full width

    // Load and resize the image from URL to cover the top 70% of the canvas, maintaining aspect ratio
    const image = await sharp(imageBuffer)
      .resize({
        width: imageWidth,
        height: imageHeight,
        fit: sharp.fit.cover, // Cover the full width and 70% height
      })
      .toBuffer();

    // Create text overlay with title, taking 20% of the canvas height, centered
    const textHeight = Math.round(canvasHeight * 0.2);

    // Split title into two lines if necessary
    const [line1, line2] = splitTitleToFit(title, 30); // Adjust the max length per line as needed

    const svgText = `
      <svg width="${canvasWidth}" height="${textHeight}">
        <rect x="0" y="0" width="${canvasWidth}" height="${textHeight}" fill="transparent"/>
        <text x="50%" y="40%" font-size="48" text-anchor="middle" fill="white" font-family="Arial" font-weight="bold" dominant-baseline="middle">
          ${line1}
        </text>
        <text x="50%" y="80%" font-size="48" text-anchor="middle" fill="white" font-family="Arial" font-weight="bold" dominant-baseline="middle">
          ${line2}
        </text>
      </svg>`;

    const textOverlay = Buffer.from(svgText);

    // Combine template, image, and title
    const finalImage = await sharp(templateImagePath)
      .resize(canvasWidth, canvasHeight) // Resize template to canvas size
      .composite([
        { input: image, top: 0, left: 0 }, // Place the image at the top 70% of the canvas
        { input: textOverlay, top: imageHeight, left: 0 }, // Add the title text below the image (centered in the next 20%)
      ])
      .png() // Convert to PNG format
      .toFile(outputFilePath); // Save the output file

    console.log("Image generated successfully:", outputFilePath);
  } catch (err) {
    console.error("Error generating image:", err);
  }
}

module.exports = generateImage;
