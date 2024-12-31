import express from "express";
import { json } from "body-parser";
import "express-async-errors"; //To enable async on route function
import fileUpload from "express-fileupload";
import { uploadFile } from "./s3.service";

const app = express();

app.use(json({ limit: "50mb" })); // parse json request body
// Middleware to parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

app.use(fileUpload({})); // To enable express file uploads

// enable cors
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,PATCH");
  res.header(
    "Access-Control-Allow-Headers",
    ["Origin", "Accept", "X-Requested-With", "Content-Type"].join(", ")
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

/**
 * Upload File Route
 *
 * This route handles file uploads from the client and stores them in an S3 bucket.
 * It uses `FormData` to process files and allows uploading multiple files in a single request.
 *
 * ## Example Usage:
 *
 * ### Client-Side Code Example
 * ```javascript
 * const formData = new FormData();
 * formData.append('files', file1); // Add the first file
 * formData.append('files', file2); // Add additional files if needed
 *
 * fetch('/upload', {
 *   method: 'POST',
 *   body: formData,
 * })
 * .then(response => response.json())
 * .then(data => console.log(data))
 * .catch(error => console.error('Error:', error));
 * ```
 */
app.post("/upload", async (req, res) => {
  // grabs all the the attached files
  const formFiles: fileUpload.FileArray | null | undefined = req.files;
  if (!formFiles || !formFiles?.files) {
    return res.status(400).send({ message: "Attach atleast on file to upload " });
  }

  const uploadedFiles = Array.isArray(formFiles.files) ? formFiles.files : [formFiles.files];

  // Upload files to S3
  const s3Urls = await Promise.all(
    uploadedFiles.map(async (file) => {
      const fileName = file.name; // Remember to sanitize to output e.g file-name.png

      const uploadPath = "images"; // could be anything e.g images, videos, pdf
      const key = `${uploadPath}/${fileName}`;

      const url = await uploadFile(key, file.data, { contentType: file.mimetype });

      return url;
    })
  );

  return res.status(200).send({
    message: "File(s) successfully uploaded",
    data: s3Urls,
  });
});

app.all("*", async (req, res) => {
  return res.status(400).send({ message: "Invalid/Incorrect route" });
});

export { app };
