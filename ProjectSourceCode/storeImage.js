const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create user_images directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../user_images');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for temporary file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Temporarily store with random name
    cb(null, `temp-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Accept images only
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Function to handle image upload and post creation
const storeImage = async (req, res, db) => {
  try {
    // Check if user is logged in
    if (!req.session.user) {
      return res.status(401).json({ status: 'error', message: 'User not logged in' });
    }

    const userId = req.session.user.user_id;
    const caption = req.body.caption || '';
    const xCoord = req.body.x_coord || null;
    const yCoord = req.body.y_coord || null;

    // Create a new post in the database
    const insertPostQuery = `
      INSERT INTO posts (user_id, caption, date_created)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      RETURNING post_id;
    `;
    
    const result = await db.one(insertPostQuery, [userId, caption]);
    const postId = result.post_id;

    // Get the file extension from the uploaded file
    const fileExtension = path.extname(req.file.originalname);
    const newFileName = `${postId}${fileExtension}`;
    const oldPath = req.file.path;
    const newPath = path.join(uploadsDir, newFileName);

    // Rename the file to post_id.extension
    fs.renameSync(oldPath, newPath);

    // If coordinates are provided, insert into location table
    if (xCoord !== null && yCoord !== null) {
      const insertLocationQuery = `
        INSERT INTO location (user_id, post_id, x_coord, y_coord)
        VALUES ($1, $2, $3, $4);
      `;
      await db.none(insertLocationQuery, [userId, postId, xCoord, yCoord]);
    }

    // Return success response
    res.status(200).json({
      status: 'success',
      message: 'Post uploaded successfully!',
      post_id: postId,
      image_path: `/user_images/${newFileName}`
    });

  } catch (error) {
    console.error('Error storing image:', error);
    
    // Clean up uploaded file if there's an error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to upload post',
      error: error.message
    });
  }
};

module.exports = { upload, storeImage };
