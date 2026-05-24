const { prisma } = require('../config/db');

const formatActivity = (act) => {
  if (!act) return null;
  return {
    id: act.id,
    _id: act.id,
    type: act.type,
    description: act.description,
    timestamp: act.timestamp,
    createdAt: act.createdAt,
    updatedAt: act.updatedAt,
    createdBy: act.createdBy ? {
      id: act.createdBy.id, _id: act.createdBy.id,
      name: act.createdBy.name, role: act.createdBy.role
    } : null,
    clientId: act.client ? {
      id: act.client.id, _id: act.client.id, companyName: act.client.companyName
    } : act.clientId,
    leadId: act.lead ? {
      id: act.lead.id, _id: act.lead.id,
      companyName: act.lead.companyName, contactPerson: act.lead.contactPerson
    } : act.leadId
  };
};

// @desc    Get all activities
// @route   GET /activities
// @access  Private
const getActivities = async (req, res) => {
  try {
    const queryWhere = {};

    if (req.query.leadId) queryWhere.leadId = req.query.leadId;
    if (req.query.clientId) queryWhere.clientId = req.query.clientId;

    // FIX: Use relational filter instead of pre-fetching lead IDs
    if (req.user.role === 'BDA Executive') {
      queryWhere.OR = [
        { lead: { assignedToId: req.user.id } },
        { createdById: req.user.id }
      ];
    }

    const activities = await prisma.activity.findMany({
      where: queryWhere,
      include: { createdBy: true, client: true, lead: true },
      orderBy: { timestamp: 'desc' },
      take: req.query.limit ? parseInt(req.query.limit) : undefined
    });

    res.json(activities.map(formatActivity));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Log a communication activity
// @route   POST /activities
// @access  Private
const createActivity = async (req, res) => {
  try {
    const { leadId, clientId, type, description, timestamp } = req.body;

    if (!clientId || !type || !description) {
      return res.status(400).json({ message: 'Please provide clientId, type, and description' });
    }

    // Run client + lead validation in parallel
    const [client, lead] = await Promise.all([
      prisma.client.findUnique({ where: { id: clientId } }),
      leadId ? prisma.lead.findUnique({ where: { id: leadId } }) : Promise.resolve(null)
    ]);

    if (!client) return res.status(404).json({ message: 'Client not found' });
    if (leadId && !lead) return res.status(404).json({ message: 'Lead not found' });
    if (leadId && lead && req.user.role === 'BDA Executive' && lead.assignedToId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to log activities for this lead' });
    }

    const activity = await prisma.activity.create({
      data: {
        leadId: leadId || null, clientId, type, description,
        createdById: req.user.id,
        timestamp: timestamp ? new Date(timestamp) : new Date()
      },
      include: { createdBy: true, client: true, lead: true }
    });

    res.status(201).json(formatActivity(activity));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getActivities, createActivity };
