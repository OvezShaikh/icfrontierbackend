import express from "express";
import jwt from "jsonwebtoken";
import Post from "../models/Post.js";
import upload from "../middleware/upload.js";
import cloudinary from "../utils/cloudinary.js";

const router = express.Router();

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token" });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

// ✅ PUBLIC: Get all posts
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("author", "username")
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ ADMIN: Create post with image
router.post("/", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    let imageUrl = null;

    if (req.file) {
      const result = await cloudinary.uploader.upload(
        `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
        { folder: "blog-posts" }
      );
      imageUrl = result.secure_url;
    }

    const post = await Post.create({
      title: req.body.title,
      content: req.body.content,
      image: imageUrl,
      author: req.user.id,
    });

    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Image upload failed" });
  }
});

// ✅ ADMIN: Update post
router.put("/:id", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    let updateData = {
      title: req.body.title,
      content: req.body.content,
      updatedAt: new Date(),
    };

    if (req.file) {
      const result = await cloudinary.uploader.upload(
        `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
        { folder: "blog-posts" }
      );
      updateData.image = result.secure_url;
    }

    const post = await Post.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    }).populate("author", "username");

    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ ADMIN: Delete post
router.delete("/:id", authMiddleware, async (req, res) => {
  await Post.findByIdAndDelete(req.params.id);
  res.json({ message: "Post deleted" });
});

// ✅ PUBLIC: Get single post
router.get("/:id", async (req, res) => {
  const post = await Post.findById(req.params.id).populate("author", "username");
  if (!post) return res.status(404).json({ message: "Not found" });
  res.json(post);
});

export default router;
