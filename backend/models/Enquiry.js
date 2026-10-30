const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true, 
    minlength: 2, 
    maxlength: 100 
  },

  email: { 
    type: String, 
    required: true, 
    lowercase: true, 
    trim: true, 
    maxlength: 254 
  },

  courseInterest: { 
    type: String, 
    required: true, 
    trim: true, 
    minlength: 2, 
    maxlength: 150 
  },

  phone: { 
    type: String, 
    trim: true, 
    maxlength: 30, 
    default: null 
  },

  message: { 
    type: String, 
    trim: true, 
    maxlength: 2000, 
    default: null 
  },

  claimedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Employee", 
    default: null, 
    index: true 
  }
  
}, { timestamps: true });
schema.index({ claimedBy: 1, createdAt: -1 });
module.exports = mongoose.model("Enquiry", schema);
