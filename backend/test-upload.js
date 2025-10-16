// Test script to check if upload module works
const { upload } = require('./middleware/upload');

console.log('Upload middleware:', typeof upload);
console.log('Upload.array:', typeof upload.array);
console.log('Available methods:', Object.getOwnPropertyNames(upload));

if (upload && typeof upload.array === 'function') {
  console.log('✅ Upload middleware is working correctly!');
} else {
  console.log('❌ Upload middleware has issues');
  console.log('Upload object:', upload);
}