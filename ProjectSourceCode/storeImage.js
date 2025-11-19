// Import required modules
const multer = require('multer'); // Middleware for handling file uploads
const path = require('path');     // Module for handling file paths
const fs = require('fs');         // File system module for file operations

// Create user_images directory if it doesn't exist
// This ensures we have a place to store uploaded images
const uploadsDir = path.join(__dirname, '../user_images');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ===========================
// MULTER STORAGE CONFIGURATION
// ===========================
// Configure where and how uploaded files are temporarily stored
const storage = multer.diskStorage({
  // Specify the destination folder for uploaded files
  destination: (req, file, cb) => {
    cb(null, uploadsDir); // Save files to user_images directory
  },
  // Generate a temporary filename for the uploaded file
  // Format: temp-{timestamp}.{extension} (e.g., temp-1699999999.jpg)
  filename: (req, file, cb) => {
    // Temporarily store with random name until we get the post_id from database
    cb(null, `temp-${Date.now()}${path.extname(file.originalname)}`);
  }
});

// ===========================
// MULTER UPLOAD MIDDLEWARE
// ===========================
// Configure file upload restrictions and validation
const upload = multer({
  storage: storage, // Use the storage configuration defined above
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB file size limit
  // Validate that only image files are accepted
  fileFilter: (req, file, cb) => {
    // Accept images only: jpeg, jpg, png, gif, webp
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    // Both extension and MIME type must match for security
    if (mimetype && extname) {
      return cb(null, true); // Accept the file
    } else {
      cb(new Error('Only image files are allowed!')); // Reject the file
    }
  }
});

// ===========================
// STORE IMAGE FUNCTION
// ===========================
// Main function to handle the complete image upload and post creation process
// This function is called after Multer has already saved the file temporarily
const storeImage = async (req, res, db) => {
  try {
    // ----------------------
    // Step 1: Authentication Check
    // ----------------------
    // Verify that the user is logged in before allowing upload
    if (!req.session.user) {
      return res.status(401).json({ status: 'error', message: 'User not logged in' });
    }

    // ----------------------
    // Step 2: Extract Data from Request
    // ----------------------
    // Get user ID from the session (stored during login)
    const userId = req.session.user.user_id;
    // Get caption from form data, default to empty string if not provided
    const caption = req.body.caption || '';
    // Get fish weight and species from form data
    const fishWeight = req.body.fish_weight || null;
    const fishSpecies = req.body.fish_species || null;
    // Get GPS coordinates from form data (optional fields)
    const xCoord = req.body.x_coord || null;
    const yCoord = req.body.y_coord || null;

    // ----------------------
    // Step 3: Create Post in Database
    // ----------------------
    // Insert a new post record and get the auto-generated post_id
    const insertPostQuery = `
      INSERT INTO posts (user_id, caption, fish_weight, fish_species, date_created)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      RETURNING post_id;
    `;
    
    const result = await db.one(insertPostQuery, [userId, caption, fishWeight, fishSpecies]);
    const postId = result.post_id; // This is the unique ID for this post

    // ----------------------
    // Step 4: Rename Image File
    // ----------------------
    // Rename the temporary file to use the post_id as the filename
    // This creates a permanent link between the post and its image
    const fileExtension = path.extname(req.file.originalname); // e.g., ".jpg"
    const newFileName = `${postId}${fileExtension}`; // e.g., "123.jpg"
    const oldPath = req.file.path; // Current temp file path: "user_images/temp-1699999999.jpg"
    const newPath = path.join(uploadsDir, newFileName); // New path: "user_images/123.jpg"

    // Perform the actual file rename operation
    fs.renameSync(oldPath, newPath);

    // ----------------------
    // Step 5: Save Location Data (Optional)
    // ----------------------
    // If GPS coordinates were provided, save them to the location table
    if (xCoord !== null && yCoord !== null) {
      const insertLocationQuery = `
        INSERT INTO location (user_id, post_id, x_coord, y_coord)
        VALUES ($1, $2, $3, $4);
      `;
      await db.none(insertLocationQuery, [userId, postId, xCoord, yCoord]);
    }

    // ----------------------
    // Step 6: Send Success Response
    // ----------------------
    // Return success message with post details to the frontend
    res.status(200).json({
      status: 'success',
      message: 'Post uploaded successfully!',
      post_id: postId,
      image_path: `/user_images/${newFileName}` // Path for displaying the image
    });

  } catch (error) {
    // ----------------------
    // Step 7: Error Handling
    // ----------------------
    // Log the error for debugging
    console.error('Error storing image:', error);
    
    // Clean up: Delete the uploaded file if something went wrong
    // This prevents orphaned files taking up space on the server
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    // Send error response to the frontend
    res.status(500).json({
      status: 'error',
      message: 'Failed to upload post',
      error: error.message
    });
  }
};

// Export both the upload middleware and storeImage function
// - upload: Used in routes like app.post('/upload', upload.single('image'), ...)
// - storeImage: The handler function that processes the upload
module.exports = { upload, storeImage };
