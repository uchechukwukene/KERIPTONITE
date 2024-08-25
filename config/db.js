import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();
const connectDB = async ()=>{

mongoose.connect(process.env.MONGO_URI);

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('MongoDb is active and functional🔥');
});
    
}

export default connectDB;
