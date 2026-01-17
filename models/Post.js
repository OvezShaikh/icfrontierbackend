import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  image: { type: String }, // path to uploaded image
  date: { type: Date, default: Date.now },
  author: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  required: true
}
});

export default mongoose.model("Post", postSchema);
