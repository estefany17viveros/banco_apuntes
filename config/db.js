const mongoose = require('mongoose');

module.exports = async function conectarDB() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/banco_apuntes';
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  console.log(`✅ MongoDB conectado: ${mongoose.connection.name}`);
};
