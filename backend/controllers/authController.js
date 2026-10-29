const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Employee = require("../models/Employee");
const validEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const tokenFor = id => jwt.sign({ employeeId: id.toString() }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body || {};
    if (typeof name !== "string" || name.trim().length < 2 || typeof email !== "string" ||
        !validEmail(email.trim()) || typeof password !== "string" || password.length < 8)
      return res.status(400).json({ success: false, message: "Provide a valid name, email, and password of at least 8 characters" });
    const normalizedEmail = email.trim().toLowerCase();
    if (await Employee.findOne({ email: normalizedEmail }))
      return res.status(409).json({ success: false, message: "An employee with this email is already registered" });
    const employee = await Employee.create({ name: name.trim(), email: normalizedEmail, password: await bcrypt.hash(password, 12) });
    res.status(201).json({ success: true, message: "Employee registered successfully", data: {
      employee: { id: employee._id, name: employee.name, email: employee.email, createdAt: employee.createdAt },
      token: tokenFor(employee._id)
    }});
  } catch (err) { next(err); }
}
async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};
    if (typeof email !== "string" || typeof password !== "string")
      return res.status(400).json({ success: false, message: "Email and password are required" });
    const employee = await Employee.findOne({ email: email.trim().toLowerCase() }).select("+password");
    if (!employee || !(await bcrypt.compare(password, employee.password)))
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    res.status(200).json({ success: true, message: "Login successful", data: {
      employee: { id: employee._id, name: employee.name, email: employee.email }, token: tokenFor(employee._id)
    }});
  } catch (err) { next(err); }
}
module.exports = { register, login };
