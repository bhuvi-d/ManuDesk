const { prisma } = require('../config/db');

// @desc    Get current notifications for user
// @route   GET /notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const notifications = [];
    const userId = req.user.id;
    const isBda = req.user.role === 'BDA Executive';

    // Query filters based on user
    let leadFilter = {};
    if (isBda) {
      leadFilter.assignedToId = userId;
    }

    const today = new Date();
    
    // 1. Negotiation deadline approaching (expectedCloseDate within next 5 days, stage is Negotiation)
    const fiveDaysFromNow = new Date();
    fiveDaysFromNow.setDate(today.getDate() + 5);

    const approachingLeads = await prisma.lead.findMany({
      where: {
        ...leadFilter,
        stage: 'Negotiation',
        expectedCloseDate: { gte: today, lte: fiveDaysFromNow }
      },
      select: { id: true, companyName: true, expectedCloseDate: true }
    });

    approachingLeads.forEach(lead => {
      notifications.push({
        id: `neg-${lead.id}`,
        type: 'warning',
        message: `Negotiation deadline approaching for ${lead.companyName} (${new Date(lead.expectedCloseDate).toLocaleDateString()})`,
        link: `/pipeline`,
        timestamp: new Date()
      });
    });

    // 2. Deal inactive for 7 days (active leads where updatedAt is > 7 days ago)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);

    const inactiveLeads = await prisma.lead.findMany({
      where: {
        ...leadFilter,
        stage: { notIn: ['Closed Won', 'Closed Lost'] },
        updatedAt: { lte: sevenDaysAgo }
      },
      select: { id: true, companyName: true, updatedAt: true }
    });

    inactiveLeads.forEach(lead => {
      notifications.push({
        id: `inactive-${lead.id}`,
        type: 'info',
        message: `Deal inactive for 7+ days: ${lead.companyName}`,
        link: `/pipeline`,
        timestamp: lead.updatedAt
      });
    });

    // 3. Quotations awaiting review (Quotations in 'Under Review' status)
    let quoteFilter = { status: 'Under Review' };
    if (isBda) {
      quoteFilter.lead = { assignedToId: userId };
    }

    const awaitingQuotes = await prisma.quotation.findMany({
      where: quoteFilter,
      include: {
        client: true
      }
    });

    awaitingQuotes.forEach(quote => {
      notifications.push({
        id: `quote-${quote.id}`,
        type: 'action',
        message: `Quotation for ${quote.client?.companyName || 'Corporate Client'} (${quote.product}) is awaiting review`,
        link: `/quotations`,
        timestamp: new Date()
      });
    });

    // 4. Follow-up due today / general tasks
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    const followUpsToday = await prisma.lead.findMany({
      where: {
        ...leadFilter,
        expectedCloseDate: { gte: startOfToday, lte: endOfToday }
      },
      select: { id: true, companyName: true }
    });

    followUpsToday.forEach(lead => {
      notifications.push({
        id: `follow-${lead.id}`,
        type: 'today',
        message: `Action item/Expected closure due today: ${lead.companyName}`,
        link: `/pipeline`,
        timestamp: new Date()
      });
    });

    // Add static welcome notice if empty
    if (notifications.length === 0) {
      notifications.push({
        id: 'welcome',
        type: 'success',
        message: `Welcome to ManuDesk Workspace. All systems nominal.`,
        link: `/`,
        timestamp: new Date()
      });
    }

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getNotifications
};
