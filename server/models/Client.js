const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: [true, 'Please add a company name'],
    unique: true,
    trim: true,
  },
  industry: {
    type: String,
    required: [true, 'Please specify the industry'],
    trim: true,
  },
  procurementContact: {
    type: String,
    required: [true, 'Please add a procurement contact name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please add contact email'],
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email',
    ],
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    required: [true, 'Please add contact phone number'],
    trim: true,
  },
  location: {
    type: String,
    required: [true, 'Please specify company location'],
    trim: true,
  },
  productInterest: {
    type: String,
    required: [true, 'Please add main product interest'],
    trim: true,
  },
  annualRequirement: {
    type: String, // e.g. "50,000 units", "100 Tons"
    required: [true, 'Please add annual requirement'],
    trim: true,
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active',
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please assign a BDA Executive'],
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Client', clientSchema);
