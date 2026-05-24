const { prisma } = require('../config/db');

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
    clientId: lead.client ? {
      id: lead.client.id,
      _id: lead.client.id,
      companyName: lead.client.companyName,
      procurementContact: lead.client.procurementContact,
      phone: lead.client.phone,
      email: lead.client.email,
      location: lead.client.location,
      industry: lead.client.industry,
      productInterest: lead.client.productInterest,
      annualRequirement: lead.client.annualRequirement,
      status: lead.client.status
    } : lead.clientId
  };
};

// @desc    Get all leads (Admin: all, BDA: assigned)
// @route   GET /leads
// @access  Private
const getLeads = async (req, res) => {
  try {
    let whereQuery = {};

    // RBAC: BDA can only see assigned leads
    if (req.user.role === 'BDA Executive') {
      whereQuery.assignedToId = req.user.id;
    } else if (req.query.assignedTo) {
      whereQuery.assignedToId = req.query.assignedTo;
    }

    // Filters
    if (req.query.stage) {
      whereQuery.stage = req.query.stage;
    }
    if (req.query.priority) {
      whereQuery.priority = req.query.priority;
    }
    if (req.query.industry) {
      whereQuery.industry = req.query.industry;
    }

    // Search query
    if (req.query.search) {
      const searchStr = req.query.search;
      whereQuery.OR = [
        { companyName: { contains: searchStr } },
        { contactPerson: { contains: searchStr } },
        { industry: { contains: searchStr } }
      ];
    }

    const leads = await prisma.lead.findMany({
      where: whereQuery,
      include: {
        assignedTo: true,
        client: true
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json(leads.map(formatLead));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single lead by ID
// @route   GET /leads/:id
// @access  Private
const getLeadById = async (req, res) => {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: req.params.id },
      include: {
        assignedTo: true,
        client: true
      }
    });

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    // RBAC check
    if (req.user.role === 'BDA Executive' && lead.assignedToId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view this lead' });
    }

    res.json(formatLead(lead));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a lead
// @route   POST /leads
// @access  Private
const createLead = async (req, res) => {
  try {
    const {
      companyName,
      industry,
      contactPerson,
      dealValue,
      priority,
      expectedCloseDate,
      clientId,
      assignedTo
    } = req.body;

    // Validate client
    const client = await prisma.client.findUnique({
      where: { id: clientId }
    });
    if (!client) {
      return res.status(404).json({ message: 'Linked Client Account not found' });
    }

    // Set BDA assignment (default to current user for BDA, or specified for Admin)
    let assignedId = req.user.id;
    if (req.user.role === 'Admin' && assignedTo) {
      assignedId = assignedTo;
    }

    const lead = await prisma.lead.create({
      data: {
        companyName,
        industry,
        contactPerson,
        dealValue: parseFloat(dealValue),
        priority,
        expectedCloseDate: new Date(expectedCloseDate),
        clientId,
        assignedToId: assignedId,
        stage: 'New Inquiry'
      }
    });

    // Log activity
    await prisma.activity.create({
      data: {
        leadId: lead.id,
        clientId: clientId,
        type: 'Follow-up',
        description: `New lead created for ${companyName} and assigned to BDA.`,
        createdById: req.user.id
      }
    });

    const populatedLead = await prisma.lead.findUnique({
      where: { id: lead.id },
      include: {
        assignedTo: true,
        client: true
      }
    });

    res.status(201).json(formatLead(populatedLead));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a lead
// @route   PUT /leads/:id
// @access  Private
const updateLead = async (req, res) => {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: req.params.id }
    });

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    // RBAC check
    if (req.user.role === 'BDA Executive' && lead.assignedToId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this lead' });
    }

    const originalStage = lead.stage;
    const { stage, assignedTo, dealValue, expectedCloseDate, ...rest } = req.body;

    // Admin-only can change assigned BDA
    if (assignedTo && req.user.role !== 'Admin' && assignedTo !== lead.assignedToId) {
      return res.status(403).json({ message: 'Only Admins can reassign BDA Executives' });
    }

    const updateData = {
      ...rest
    };

    if (stage) updateData.stage = stage;
    if (assignedTo) updateData.assignedToId = assignedTo;
    if (dealValue !== undefined) updateData.dealValue = parseFloat(dealValue);
    if (expectedCloseDate) updateData.expectedCloseDate = new Date(expectedCloseDate);

    const updatedLead = await prisma.lead.update({
      where: { id: req.params.id },
      data: updateData
    });

    // Log activity if stage changed
    if (stage && stage !== originalStage) {
      await prisma.activity.create({
        data: {
          leadId: lead.id,
          clientId: lead.clientId,
          type: 'Negotiation Update',
          description: `Lead stage moved from '${originalStage}' to '${stage}'.`,
          createdById: req.user.id
        }
      });
    }

    const populatedLead = await prisma.lead.findUnique({
      where: { id: lead.id },
      include: {
        assignedTo: true,
        client: true
      }
    });

    res.json(formatLead(populatedLead));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a lead
// @route   DELETE /leads/:id
// @access  Private
const deleteLead = async (req, res) => {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: req.params.id }
    });

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    // RBAC check: BDA cannot delete leads, only Admin
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Only administrators can delete leads' });
    }

    // Delete associated activities and quotations first (cascade or clear)
    await prisma.activity.deleteMany({ where: { leadId: lead.id } });
    await prisma.quotation.deleteMany({ where: { leadId: lead.id } });

    await prisma.lead.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Lead removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  formatLead
};
