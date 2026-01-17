import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

const router = express.Router();

// SHOW CREATE USER FORM
router.get("/create-user", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Create Admin User</title>
        <style>
          body { font-family: Arial; background:#f4f4f4; }
          form { width:300px; margin:100px auto; background:#fff; padding:20px; border-radius:6px; }
          input, button { width:100%; padding:10px; margin:10px 0; }
          button { background:#2563eb; color:#fff; border:none; cursor:pointer; }
        </style>
      </head>
      <body>
        <form method="POST" action="/admin/create-user">
          <h2>Create Admin</h2>
          <input name="username" placeholder="Username" required />
          <input name="password" type="password" placeholder="Password" required />
          <button type="submit">Create User</button>
        </form>
      </body>
    </html>
  `);
});

// HANDLE FORM SUBMIT
router.post("/create-user", async (req, res) => {
  const { username, password } = req.body;

  const existing = await User.findOne({ username });
  if (existing) {
    return res.send("<h3>User already exists</h3>");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await User.create({
    username,
    password: hashedPassword,
  });

  res.send("<h3>Admin user created successfully</h3>");
});

export default router;
