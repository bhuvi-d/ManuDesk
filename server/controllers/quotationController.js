const { prisma } = require('../config/db');

const formatQuote = (q) => {
  if (!q) return null;
  return {
    id: q.id, _id: q.id,
    product: q.product, quantity: q.quantity, unitPrice: q.unitPrice,
    discount: q.discount, deliveryTimeline: q.deliveryTimeline,
    status: q.status, terms: q.terms, totalValue: q.totalValue,
    createdAt: q.createdAt, updatedAt: q.updatedAt,
    clientId: q.client ? {
      id: q.client.id, _id: q.client.id,
      companyName: q.client.companyName, location: q.client.location,
      procurementContact: q.client.procurementContact
    } : q.clientId,
    leadId: q.lead ? {
      id: q.lead.id, _id: q.lead.id,
      contactPerson: q.lead.contactPerson, dealValue: q.lead.dealValue,
      assignedTo: q.lead.assignedTo ? {
        id: q.lead.assignedTo.id, _id: q.lead.assignedTo.id,
        name: q.lead.assignedTo.name, email: q.lead.assignedTo.email
      } : null
    } : q.leadId
  };
};

const QUOTE_INCLUDE = {
  client: true,
  lead: { include: { assignedTo: true } }
};

// @desc    Get all quotations
// @route   GET /quotations
// @access  Private
const getQuotations = async (req, res) => {
  try {
    const queryWhere = {};

    // FIX: Use relational filter — no pre-fetch of lead IDs needed
    if (req.user.role === 'BDA Executive') {
      queryWhere.lead = { assignedToId: req.user.id };
    }

    if (req.query.status) queryWhere.status = req.query.status;

    const quotations = await prisma.quotation.findMany({
      where: queryWhere,
      include: QUOTE_INCLUDE,
      orderBy: { createdAt: 'desc' }
    });

    res.json(quotations.map(formatQuote));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single quotation by ID
// @route   GET /quotations/:id
// @access  Private
const getQuotationById = async (req, res) => {
  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id: req.params.id },
      include: QUOTE_INCLUDE
    });

    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });

    if (req.user.role === 'BDA Executive' && quotation.lead?.assignedToId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view this quotation' });
    }

    res.json(formatQuote(quotation));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a quotation
// @route   POST /quotations
// @access  Private
const createQuotation = async (req, res) => {
  try {
    const { leadId, clientId, product, quantity, unitPrice, discount, deliveryTimeline, terms } = req.body;

    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) return res.status(404).json({ message: 'Linked Lead not found' });
    if (req.user.role === 'BDA Executive' && lead.assignedToId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to create quotations for this lead' });
    }

    const qVal = parseInt(quantity);
    const uPrice = parseFloat(unitPrice);
    const disc = parseFloat(discount || 0);
    const totalValue = (qVal * uPrice) * (1 - disc / 100);

    const activityDesc = `Draft quotation created for ${product} (${quantity} units @ ₹${unitPrice}/unit). Total: ₹${totalValue.toLocaleString()}. Lead stage updated to 'Quotation Prepared'.`;

    // Run quotation create + conditional lead stage update + activity log in parallel
    const [quotation] = await Promise.all([
      prisma.quotation.create({
        data: { leadId, clientId, product, quantity: qVal, unitPrice: uPrice, discount: disc, deliveryTimeline, status: 'Draft', terms, totalValue }
      }),
      ['New Inquiry', 'Requirement Discussion'].includes(lead.stage)
        ? prisma.lead.update({ where: { id: lead.id }, data: { stage: 'Quotation Prepared' } })
        : Promise.resolve(),
      prisma.activity.create({
        data: { leadId, clientId, type: 'Negotiation Update', description: activityDesc, createdById: req.user.id }
      })
    ]);

    res.status(201).json(quotation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a quotation
// @route   PUT /quotations/:id
// @access  Private
const updateQuotation = async (req, res) => {
  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id: req.params.id },
      include: { lead: true }
    });

    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });
    if (req.user.role === 'BDA Executive' && quotation.lead?.assignedToId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this quotation' });
    }

    const prevStatus = quotation.status;
    const { status, quantity, unitPrice, discount, ...rest } = req.body;

    let totalValue = quotation.totalValue;
    if (quantity !== undefined || unitPrice !== undefined || discount !== undefined) {
      const q = quantity !== undefined ? parseInt(quantity) : quotation.quantity;
      const p = unitPrice !== undefined ? parseFloat(unitPrice) : quotation.unitPrice;
      const d = discount !== undefined ? parseFloat(discount) : quotation.discount;
      totalValue = (q * p) * (1 - d / 100);
    }

    const updateData = { ...rest, totalValue };
    if (status) updateData.status = status;
    if (quantity !== undefined) updateData.quantity = parseInt(quantity);
    if (unitPrice !== undefined) updateData.unitPrice = parseFloat(unitPrice);
    if (discount !== undefined) updateData.discount = parseFloat(discount);

    const updatedQuotation = await prisma.quotation.update({
      where: { id: req.params.id },
      data: updateData
    });

    // Trigger workflow side-effects in parallel
    if (status && status !== prevStatus) {
      const lead = quotation.lead;
      let activityDesc = `Quotation status updated from '${prevStatus}' to '${status}'.`;
      const sideEffects = [];

      if (status === 'Sent' && lead?.stage === 'Quotation Prepared') {
        sideEffects.push(prisma.lead.update({ where: { id: lead.id }, data: { stage: 'Quotation Sent' } }));
        activityDesc += ` Lead stage advanced to 'Quotation Sent'.`;
      } else if (status === 'Approved') {
        sideEffects.push(prisma.lead.update({ where: { id: lead.id }, data: { stage: 'Negotiation', dealValue: totalValue } }));
        activityDesc += ` Lead stage advanced to 'Negotiation'. Deal value updated to ₹${totalValue.toLocaleString()}.`;
      } else if (status === 'Rejected') {
        activityDesc += ` Quotation was rejected. BDA review required for revision.`;
      }

      sideEffects.push(prisma.activity.create({
        data: { leadId: quotation.leadId, clientId: quotation.clientId, type: 'Negotiation Update', description: activityDesc, createdById: req.user.id }
      }));

      await Promise.all(sideEffects);
    }

    res.json(updatedQuotation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getQuotations, getQuotationById, createQuotation, updateQuotation };
