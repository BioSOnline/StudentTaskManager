const multer = require('multer');
const { GridFSBucket } = require('mongodb');
const mongoose = require('mongoose');
const path = require('path');

// Create GridFS bucket
let gfsBucket;
mongoose.connection.once('open', () => {
  gfsBucket = new GridFSBucket(mongoose.connection.db, {
    bucketName: 'assignments'
  });
});

// Configure multer for memory storage
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files
  },
  fileFilter: (req, file, cb) => {
    // Allow common assignment file types
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|txt|zip|rar|ppt|pptx|xls|xlsx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = /jpeg|jpg|png|pdf|msword|officedocument|text|zip|rar|presentation|sheet/.test(file.mimetype);
    
    if (mimetype || extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only documents, images, and archives are allowed!'), false);
    }
  }
});

// Function to upload file to GridFS
const uploadToGridFS = (file, metadata) => {
  return new Promise((resolve, reject) => {
    if (!gfsBucket) {
      return reject(new Error('GridFS bucket not initialized'));
    }

    const filename = `${Date.now()}-${file.originalname}`;
    const uploadStream = gfsBucket.openUploadStream(filename, {
      metadata: metadata
    });

    uploadStream.on('error', (error) => {
      reject(error);
    });

    uploadStream.on('finish', (file) => {
      resolve({
        id: file._id,
        filename: filename,
        originalName: file.filename,
        size: file.length,
        uploadDate: file.uploadDate,
        contentType: file.metadata?.contentType || 'application/octet-stream'
      });
    });

    // Write file buffer to GridFS
    uploadStream.end(file.buffer);
  });
};

// Function to download file from GridFS
const downloadFromGridFS = (fileId) => {
  return new Promise((resolve, reject) => {
    if (!gfsBucket) {
      return reject(new Error('GridFS bucket not initialized'));
    }

    gfsBucket.find({ _id: new mongoose.Types.ObjectId(fileId) }).toArray((err, files) => {
      if (err) return reject(err);
      if (!files || files.length === 0) {
        return reject(new Error('File not found'));
      }

      const downloadStream = gfsBucket.openDownloadStream(new mongoose.Types.ObjectId(fileId));
      resolve({
        stream: downloadStream,
        file: files[0]
      });
    });
  });
};

// Function to delete file from GridFS
const deleteFromGridFS = (fileId) => {
  return new Promise((resolve, reject) => {
    if (!gfsBucket) {
      return reject(new Error('GridFS bucket not initialized'));
    }

    gfsBucket.delete(new mongoose.Types.ObjectId(fileId), (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
};

module.exports = {
  upload,
  uploadToGridFS,
  downloadFromGridFS,
  deleteFromGridFS,
  getGridFSBucket: () => gfsBucket
};