import mongoose from 'mongoose';

export async function connectDB(uri) {
  try {
    await mongoose.connect(uri, { 
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
}

export default mongoose;