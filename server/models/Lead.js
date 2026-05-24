const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: [true, 'Please add a company name'],
    trim: true,
  },
  industry: {
    type: String,
    required: [true, 'Please add an industry'],
    trim: true,
  },
  contactPerson: {
    type: String,
    required: [true, 'Please add a contact person name'],
    trim: true,
  },
  stage: {
    type: String,
    enum: [
      'New Inquiry',
      'Requirement Discussion',
      'Quotation Prepared',
      'Quotation Sent',
      'Negotiation',
      'Purchase Order Received',
      'Closed Won',
      'Closed Lost'
    ],
    default: 'New Inquiry',
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please assign a BDA Executive'],
  },
  dealValue: {
    type: Number,
    required: [true, 'Please add deal value in USD/INR'],
    min: [0, 'Deal value cannot be negative'],
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium',
  },
  expectedCloseDate: {
    type: Date,
    required: [true, 'Please specify expected close date'],
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: [true, 'Please link to a Client Account'],
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Lead', leadSchema);
