const mongoose = require('mongoose');

const quotationSchema = new mongoose.Schema({
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    required: [true, 'Please link to a pipeline lead'],
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: [true, 'Please link to a client account'],
  },
  product: {
    type: String,
    required: [true, 'Please specify the product / part name'],
    trim: true,
  },
  quantity: {
    type: Number,
    required: [true, 'Please specify the quantity'],
    min: [1, 'Quantity must be at least 1'],
  },
  unitPrice: {
    type: Number,
    required: [true, 'Please specify unit price'],
    min: [0, 'Unit price cannot be negative'],
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative'],
    max: [100, 'Discount cannot exceed 100%'],
  },
  deliveryTimeline: {
    type: String, // e.g. "4 Weeks", "15 Days"
    required: [true, 'Please add delivery timeline'],
    trim: true,
  },
  status: {
    type: String,
    enum: ['Draft', 'Sent', 'Under Review', 'Approved', 'Rejected'],
    default: 'Draft',
  },
  terms: {
    type: String, // Payment and logistics terms
    required: [true, 'Please specify terms & conditions'],
    trim: true,
  },
  totalValue: {
    type: Number,
    required: [true, 'Please specify total quotation value'],
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Quotation', quotationSchema);
