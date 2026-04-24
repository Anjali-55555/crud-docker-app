const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_dev_key_change_in_prod";

/* ─────────────── SCHEMAS ─────────────── */

const UserSchema = new mongoose.Schema({
  name:  { type: String, required: true, trim: true },
  email: {
    type: String, required: true, unique: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format"]
  },
  age: { type: Number, required: true, min: [1, "Age must be at least 1"], max: [120, "Too high"] }
}, { timestamps: true });

const AuthSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true }
}, { timestamps: true });

const User     = mongoose.model("User", UserSchema);
const AuthUser = mongoose.model("AuthUser", AuthSchema);

/* ─────────────── AUTH MIDDLEWARE ─────────────── */

function authRequired(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer "))
    return res.status(401).json({ message: "Unauthorized – please log in" });
  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

/* ─────────────── AUTH ROUTES ─────────────── */

app.post("/auth/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ message: "Username and password are required" });
    if (password.length < 6)
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    const exists = await AuthUser.findOne({ username });
    if (exists) return res.status(409).json({ message: "Username already taken" });
    const hashed = await bcrypt.hash(password, 10);
    const authUser = await AuthUser.create({ username, password: hashed });
    const token = jwt.sign({ id: authUser._id, username }, JWT_SECRET, { expiresIn: "24h" });
    res.status(201).json({ token, username });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ message: "Username and password are required" });
    const authUser = await AuthUser.findOne({ username });
    if (!authUser) return res.status(401).json({ message: "Invalid credentials" });
    const match = await bcrypt.compare(password, authUser.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });
    const token = jwt.sign({ id: authUser._id, username }, JWT_SECRET, { expiresIn: "24h" });
    res.json({ token, username });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/* ─────────────── USER ROUTES (protected) ─────────────── */

app.post("/users", authRequired, async (req, res) => {
  try {
    const { name, email, age } = req.body;
    if (!name || !email || age === undefined || age === "")
      return res.status(400).json({ message: "All fields are required" });
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRx.test(email))
      return res.status(400).json({ message: "Invalid email format" });
    const ageNum = Number(age);
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 120)
      return res.status(400).json({ message: "Age must be a number between 1 and 120" });
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: "Email already exists" });
    const user = await User.create({ name, email, age: ageNum });
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.get("/users", authRequired, async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json(users);
});

app.get("/users/stats", authRequired, async (req, res) => {
  const total  = await User.countDocuments();
  const avgAge = await User.aggregate([{ $group: { _id: null, avg: { $avg: "$age" } } }]);
  const newest = await User.findOne().sort({ createdAt: -1 });
  const oldest = await User.findOne().sort({ createdAt:  1 });
  res.json({
    total,
    avgAge: avgAge[0]?.avg?.toFixed(1) ?? "–",
    newest: newest?.name ?? "–",
    oldest: oldest?.name ?? "–"
  });
});

app.put("/users/:id", authRequired, async (req, res) => {
  try {
    const { name, email, age } = req.body;
    if (!name || !email || age === undefined || age === "")
      return res.status(400).json({ message: "All fields are required" });
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRx.test(email))
      return res.status(400).json({ message: "Invalid email format" });
    const ageNum = Number(age);
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 120)
      return res.status(400).json({ message: "Age must be between 1 and 120" });
    const user = await User.findByIdAndUpdate(
      req.params.id, { name, email, age: ageNum },
      { new: true, runValidators: true }
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete("/users/:id", authRequired, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public","index.html"));
});

mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/crudapp")
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
