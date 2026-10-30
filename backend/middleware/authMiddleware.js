const jwt = require("jsonwebtoken");
const Employee = require("../models/Employee");


async function protect(req, res, next) {
  try {
    const header = req.headers.authorization;

    if (!header.startsWith("Bearer "))
       return res.status(401).json({
      success: false,
      message: "Authentication token is required" });
      
    const token = header.slice(7).trim();
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const employee = await Employee.findById(payload.employeeId).select("_id name email");
    if (!employee) return res.status(401).json({ success: false, message: "Employee account not found" });
    req.user = employee;
    next();
  } catch (err) {
    if (["JsonWebTokenError", "TokenExpiredError"].includes(err.name))
      return res.status(401).json({ success: false, message: "Invalid or expired authentication token" });
    next(err);
  }
}
module.exports = { protect };
