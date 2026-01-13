const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

const app = express();

// Middleware
app.use(express.json());
app.use(express.static("public"));

/* =========================
   ROUTES
========================= */

// Home page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// CREATE user (with validation)
app.post("/users", async (req, res) => {
  try {
    const { name, email, age } = req.body;

    if (!name || !email || !age) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = new User({ name, email, age });
    await user.save();

    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// READ users
app.get("/users", async (req, res) => {
  const users = await User.find();
  res.json(users);
});

// UPDATE user
app.put("/users/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE user
app.delete("/users/:id", async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: "User deleted" });
});

/* =========================
   MONGODB CONNECTION
========================= */

mongoose
  .connect("mongodb://mongo:27017/cruddb")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

/* =========================
   SCHEMA & MODEL
========================= */

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  age: {
    type: Number,
    min: 1
  }
});

const User = mongoose.model("User", UserSchema);

/* =========================
   START SERVER
========================= */

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
