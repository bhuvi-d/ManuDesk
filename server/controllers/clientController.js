const { prisma } = require('../config/db');

const formatClient = (client) => {
  if (!client) return null;
  return {
    id: client.id,
    _id: client.id,
    companyName: client.companyName,
    industry: client.industry,
    procurementContact: client.procurementContact,
    email: client.email,
    phone: client.phone,
    location: client.location,
    productInterest: client.productInterest,
    annualRequirement: client.annualRequirement,
    status: client.status,
    createdAt: client.createdAt,
    updatedAt: client.updatedAt,
    assignedTo: client.assignedTo ? {
      id: client.assignedTo.id,
      _id: client.assignedTo.id,
      name: client.assignedTo.name,
      email: client.assignedTo.email
    } : null
  };
};

const formatLead = (lead) => {
  if (!lead) return null;
  return {
    id: lead.id,
    _id: lead.id,
    companyName: lead.companyName,
    industry: lead.industry,
    contactPerson: lead.contactPerson,
    stage: lead.stage,
    dealValue: lead.dealValue,
    priority: lead.priority,
    expectedCloseDate: lead.expectedCloseDate,
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt,
    assignedTo: lead.assignedTo ? {
      id: lead.assignedTo.id,
      _id: lead.assignedTo.id,
      name: lead.assignedTo.name,
      email: lead.assignedTo.email
    } : null,
    clientId: lead.clientId
  };
};

const formatActivity = (act) => {
  if (!act) return null;
  return {
    id: act.id,
    _id: act.id,
    leadId: act.leadId,
    clientId: act.clientId,
    type: act.type,
    description: act.description,
    timestamp: act.timestamp,
    createdAt: act.createdAt,
    updatedAt: act.updatedAt,
    createdBy: act.createdBy ? {
      id: act.createdBy.id,
      _id: act.createdBy.id,
      name: act.createdBy.name,
      role: act.createdBy.role
    } : null
  };
};

// @desc    Get all client accounts
// @route   GET /clients
// @access  Private
const getClients = async (req, res) => {
  try {
    let whereQuery = {};

    // Support filtering by BDA
    if (req.user.role === 'BDA Executive') {
      if (req.query.myClients === 'true') {
        whereQuery.assignedToId = req.user.id;
      }
    } else if (req.query.assignedTo) {
      whereQuery.assignedToId = req.query.assignedTo;
    }

    if (req.query.industry) {
      whereQuery.industry = req.query.industry;
    }

    if (req.query.search) {
      const searchStr = req.query.search;
      whereQuery.OR = [
        { companyName: { contains: searchStr } },
        { procurementContact: { contains: searchStr } },
        { location: { contains: searchStr } }
      ];
    }

    const clients = await prisma.client.findMany({
      where: whereQuery,
      include: {
        assignedTo: true
      },
      orderBy: { companyName: 'asc' }
    });

    res.json(clients.map(formatClient));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single client detailed profile with leads, quotes, activities
// @route   GET /clients/:id
// @access  Private
const getClientById = async (req, res) => {
  try {
    // Run client fetch + all related data in parallel
    const [client, leads, quotations, activities] = await Promise.all([
      prisma.client.findUnique({ where: { id: req.params.id }, include: { assignedTo: true } }),
      prisma.lead.findMany({ where: { clientId: req.params.id }, include: { assignedTo: true }, orderBy: { updatedAt: 'desc' } }),
      prisma.quotation.findMany({ where: { clientId: req.params.id }, orderBy: { createdAt: 'desc' } }),
      prisma.activity.findMany({ where: { clientId: req.params.id }, include: { createdBy: true }, orderBy: { timestamp: 'desc' } })
    ]);

    if (!client) return res.status(404).json({ message: 'Client not found' });

    res.json({
      client: formatClient(client),
      leads: leads.map(formatLead),
      quotations: quotations.map(q => ({ ...q, _id: q.id })),
      activities: activities.map(formatActivity)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a client account
// @route   POST /clients
// @access  Private
const createClient = async (req, res) => {
  try {
    const {
      companyName,
      industry,
      procurementContact,
      email,
      phone,
      location,
      productInterest,
      annualRequirement,
      status,
      assignedTo
    } = req.body;

    const exists = await prisma.client.findUnique({
      where: { companyName }
    });
    if (exists) {
      return res.status(400).json({ message: 'Client company already registered' });
    }

    // Default assignee
    let assigneeId = req.user.id;
    if (req.user.role === 'Admin' && assignedTo) {
      assigneeId = assignedTo;
    }

    const client = await prisma.client.create({
      data: {
        companyName,
        industry,
        procurementContact,
        email,
        phone,
        location,
        productInterest,
        annualRequirement,
        status: status || 'Active',
        assignedToId: assigneeId
      },
      include: {
        assignedTo: true
      }
    });

    res.status(201).json(formatClient(client));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update client account details
// @route   PUT /clients/:id
// @access  Private
const updateClient = async (req, res) => {
  try {
    const client = await prisma.client.findUnique({
      where: { id: req.params.id }
    });

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // BDAs can only edit clients assigned to them (unless they are Admin)
    if (req.user.role === 'BDA Executive' && client.assignedToId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this client account' });
    }

    const { assignedTo, ...rest } = req.body;
    const updateData = {
      ...rest
    };
    if (assignedTo) {
      updateData.assignedToId = assignedTo;
    }

    const updatedClient = await prisma.client.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        assignedTo: true
      }
    });

    res.json(formatClient(updatedClient));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete client (Admin only)
// @route   DELETE /clients/:id
// @access  Private/Admin
const deleteClient = async (req, res) => {
  try {
    const client = await prisma.client.findUnique({
      where: { id: req.params.id }
    });

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Only Admins can delete client accounts' });
    }

    // Verify if there are active leads linked
    const linkedLeadsCount = await prisma.lead.count({
      where: { clientId: client.id }
    });
    if (linkedLeadsCount > 0) {
      return res.status(400).json({
        message: `Cannot delete client. There are ${linkedLeadsCount} active lead pipeline(s) linked to this account.`
      });
    }

    // Delete associated activities and quotations first
    await prisma.activity.deleteMany({ where: { clientId: client.id } });
    await prisma.quotation.deleteMany({ where: { clientId: client.id } });

    await prisma.client.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Client removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient
};
