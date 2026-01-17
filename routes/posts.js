import express from "express";
import multer from "multer";
import Post from "../models/Post.js";
import jwt from "jsonwebtoken";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// Multer setup for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// Middleware to check token
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

// ✅ PUBLIC: Get all posts (no auth required)
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('author', 'username') // Get admin username
      .sort({ createdAt: -1 }); // Use createdAt for sorting
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ ADMIN ONLY: Create post
router.post("/", authMiddleware, upload.single("image"), async (req, res) => {
  const { title, content } = req.body;
  const image = req.file ? req.file.path : null;
  
  const post = new Post({ 
    title, 
    content, 
    image,
    author: req.user.id  // From authMiddleware
  });
  
  await post.save();
  res.json(post);
});

// ✅ ADMIN ONLY: Edit post
router.put("/:id", authMiddleware, upload.single("image"), async (req, res) => {
  const { title, content } = req.body;
  const image = req.file ? req.file.path : undefined;
  
  const updatedPost = await Post.findByIdAndUpdate(
    req.params.id,
    { 
      title, 
      content, 
      ...(image && { image }),
      updatedAt: new Date() 
    },
    { new: true }
  ).populate('author', 'username');
  
  res.json(updatedPost);
});

// ✅ ADMIN ONLY: Delete post
router.delete("/:id", authMiddleware, async (req, res) => {
  await Post.findByIdAndDelete(req.params.id);
  res.json({ message: "Post deleted" });
});

// ✅ PUBLIC: Get single post by ID (for blog post page)
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username');
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
