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
    clientId: lead.clientId
  };
};

const globalSearch = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.json({ leads: [], clients: [], quotations: [] });
    }

    const isBda = req.user.role === 'BDA Executive';
    const userId = req.user.id;

    // 1. Query Leads
    let leadWhere = {
      OR: [
        { companyName: { contains: q } },
        { contactPerson: { contains: q } },
        { industry: { contains: q } }
      ]
    };
    if (isBda) {
      leadWhere.assignedToId = userId;
    }
    const leads = await prisma.lead.findMany({
      where: leadWhere,
      include: { assignedTo: true },
      take: 10
    });

    // 2. Query Clients
    let clientWhere = {
      OR: [
        { companyName: { contains: q } },
        { procurementContact: { contains: q } },
        { location: { contains: q } }
      ]
    };
    const clients = await prisma.client.findMany({
      where: clientWhere,
      include: { assignedTo: true },
      take: 10
    });

    // 3. Query Quotations
    let quoteWhere = {
      product: { contains: q }
    };
    if (isBda) {
      quoteWhere.lead = { assignedToId: userId };
    }
    const quotations = await prisma.quotation.findMany({
      where: quoteWhere,
      include: { client: true, lead: true },
      take: 10
    });

    res.json({
      leads: leads.map(formatLead),
      clients: clients.map(c => ({
        ...c,
        _id: c.id,
        assignedTo: c.assignedTo ? { _id: c.assignedTo.id, name: c.assignedTo.name } : null
      })),
      quotations: quotations.map(qt => ({
        ...qt,
        _id: qt.id,
        clientId: qt.client ? { _id: qt.client.id, companyName: qt.client.companyName } : qt.clientId
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { globalSearch };
