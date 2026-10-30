const mongoose = require("mongoose");
const Enquiry = require("../models/Enquiry");

const validEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

async function createEnquiry(req, res, next) {
  try {
    const { name, email, courseInterest, phone, message } = req.body;
    if (typeof name !== "string" ||
        name.trim().length < 2 ||
        typeof email !== "string" ||
        !validEmail(email.trim()) ||
        typeof courseInterest !== "string" || 
         courseInterest.trim().length < 2)

      return res.status(400).json({ 
        success: false, 
        message: "Provide a valid name, email, and courseInterest" });

    if (phone != null && 
      typeof phone !== "string") 
      return res.status(400).json({ 
        success: false,
         message: "Phone must be a string" });

    if (message != null &&
       typeof message !== "string") 
       return res.status(400).json({
         success: false, 
         message: "Message must be a string" });

    const enquiry = await Enquiry.create({
       name: name.trim(),
       email: email.trim().toLowerCase(), 
       courseInterest: courseInterest.trim(),
       phone: phone ? phone.trim() : null,
      message: message ? message.trim() : null
    });

    res.status(201).json({ success: true,
      message: "Enquiry submitted successfully",
      data: { enquiry } });
  } catch (err) {
     next(err); 
    }
}
async function getUnclaimedEnquiries(req, res, next) {
  try {
    const enquiries = await Enquiry.find({ claimedBy: null }).sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, count: enquiries.length, data: { enquiries } });
  } catch (err) { next(err); }
}
async function claimEnquiry(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
       return res.status(400).json({
       success: false, message: "Invalid enquiry ID" });

    const enquiry = await Enquiry.findOneAndUpdate(
      { _id: id, claimedBy: null }, { $set: { claimedBy: req.user._id } },
      { new: true, runValidators: true }
    );

    if (enquiry) 
      return res.status(200).json({ 
    success: true, message: "Enquiry claimed successfully",
     data: { enquiry 
     }});

    if (!(await Enquiry.exists({ _id: id })))
       return res.status(404).json({
       success: false, message: "Enquiry not found" });
    res.status(409).json({
       success: false,
      message: "This enquiry has already been claimed" });
  } catch (err) {
    next(err);
   }
}


async function getMyEnquiries(req, res, next) {
  try {
    const enquiries = await Enquiry.find({
       claimedBy: req.user._id }).sort({
         createdAt: -1 
        }).lean();

    res.status(200).json({
       success: true,
        count: enquiries.length,
         data: { enquiries } });
  } catch (err) { 
    next(err);
   }
}
module.exports = { createEnquiry, getUnclaimedEnquiries, claimEnquiry, getMyEnquiries };
