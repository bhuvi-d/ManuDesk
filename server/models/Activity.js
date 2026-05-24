const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    required: false, // Some activity can be client-level without being in a specific lead pipeline
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: [true, 'Please link to a client account'],
  },
  type: {
    type: String,
    enum: ['Call', 'Meeting', 'Email', 'Site Visit', 'Follow-up', 'Negotiation Update'],
    required: [true, 'Please select an activity type'],
  },
  description: {
    type: String,
    required: [true, 'Please write a brief description of the activity'],
    trim: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please specify who logged this activity'],
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Activity', activitySchema);
