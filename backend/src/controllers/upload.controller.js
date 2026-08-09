// src/controllers/upload.controller.js
// Handles image uploads for product photos, sent to Cloudinary via multer.

async function uploadImages(req, res) {
  try {
    const files = req.files || (req.file ? [req.file] : []);

    if (!files.length) {
      return res.status(400).json({
        success: false,
        message: 'No image file(s) provided',
      });
    }

    // multer-storage-cloudinary puts the hosted URL on file.path
    const urls = files.map((f) => f.path);

    return res.status(201).json({
      success: true,
      data: { urls },
    });
  } catch (err) {
    console.error('uploadImages error:', err);
    return res.status(500).json({ success: false, message: 'Upload failed' });
  }
}

module.exports = { uploadImages };