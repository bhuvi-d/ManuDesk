const { prisma } = require('../config/db');

// @desc    Get dashboard KPI and chart analytics
// @route   GET /analytics/dashboard
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const isBDA = req.user.role === 'BDA Executive';
    const userId = req.user.id;
    const leadWhere = isBDA ? { assignedToId: userId } : {};

    // ── 1. Run all KPI queries in PARALLEL (not sequentially) ──────────────
    const [
      totalLeads,
      activeOpportunities,
      closedDeals,
      pipelineValueResult,
      revenueResult,
      quotationsSent,
      stageGroups,
      bdas,
    ] = await Promise.all([
      prisma.lead.count({ where: leadWhere }),

      prisma.lead.count({
        where: { ...leadWhere, stage: { notIn: ['Closed Won', 'Closed Lost'] } }
      }),

      prisma.lead.count({
        where: { ...leadWhere, stage: 'Closed Won' }
      }),

      prisma.lead.aggregate({
        _sum: { dealValue: true },
        where: { ...leadWhere, stage: { notIn: ['Closed Won', 'Closed Lost'] } }
      }),

      prisma.lead.aggregate({
        _sum: { dealValue: true },
        where: { ...leadWhere, stage: 'Closed Won' }
      }),

      prisma.quotation.count({
        where: {
          ...(isBDA ? { lead: { assignedToId: userId } } : {}),
          status: { in: ['Sent', 'Under Review', 'Approved'] }
        }
      }),

      // Single groupBy query replaces 8×2 stage queries
      prisma.lead.groupBy({
        by: ['stage'],
        where: leadWhere,
        _count: { stage: true },
        _sum: { dealValue: true },
      }),

      // Fetch BDAs for conversion chart
      isBDA
        ? Promise.resolve([{ id: userId, name: req.user.name }])
        : prisma.user.findMany({ where: { role: 'BDA Executive' }, select: { id: true, name: true } }),
    ]);

    const pipelineValue = pipelineValueResult._sum.dealValue || 0;
    const revenueGenerated = revenueResult._sum.dealValue || 0;

    // ── 2. Build pipeline distribution from the single groupBy result ───────
    const STAGES = [
      'New Inquiry', 'Requirement Discussion', 'Quotation Prepared',
      'Quotation Sent', 'Negotiation', 'Purchase Order Received',
      'Closed Won', 'Closed Lost'
    ];
    const stageMap = {};
    for (const row of stageGroups) {
      stageMap[row.stage] = { count: row._count.stage, value: row._sum.dealValue || 0 };
    }
    const pipelineDistribution = STAGES.map(stage => ({
      stage,
      count: stageMap[stage]?.count || 0,
      value: stageMap[stage]?.value || 0,
    }));

    // ── 3. Monthly revenue — fetch ALL closed-won leads once, group in JS ───
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const closedLeads = await prisma.lead.findMany({
      where: {
        ...leadWhere,
        stage: 'Closed Won',
        updatedAt: { gte: sixMonthsAgo }
      },
      select: { dealValue: true, updatedAt: true }
    });

    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const yr = d.getFullYear();
      const mo = d.getMonth();
      const revenue = closedLeads
        .filter(l => {
          const u = new Date(l.updatedAt);
          return u.getFullYear() === yr && u.getMonth() === mo;
        })
        .reduce((sum, l) => sum + (l.dealValue || 0), 0);

      monthlyRevenue.push({
        month: d.toLocaleString('default', { month: 'short' }),
        revenue,
        year: yr
      });
    }

    // ── 4. Team conversion — fetch all BDA lead counts in parallel ──────────
    const bdaMetrics = await Promise.all(
      bdas.map(async bda => {
        const [total, won] = await Promise.all([
          prisma.lead.count({ where: { assignedToId: bda.id } }),
          prisma.lead.count({ where: { assignedToId: bda.id, stage: 'Closed Won' } }),
        ]);
        return {
          name: bda.name,
          conversionRate: total > 0 ? Math.round((won / total) * 100) : 0,
          totalLeads: total,
          wonLeads: won
        };
      })
    );

    res.json({
      kpi: { totalLeads, activeOpportunities, quotationsSent, pipelineValue, closedDeals, revenueGenerated },
      charts: { pipelineDistribution, monthlyRevenue, teamConversion: bdaMetrics }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Team Performance Leaderboard
// @route   GET /analytics/leaderboard
// @access  Private
const getLeaderboard = async (req, res) => {
  try {
    const bdas = await prisma.user.findMany({
      where: { role: 'BDA Executive' },
      select: { id: true, name: true, email: true }
    });

    // Run each BDA's 4 queries in parallel, and all BDAs in parallel
    const leaderboard = await Promise.all(
      bdas.map(async bda => {
        const [totalLeads, closedDeals, revenueResult, quotationsCreated] = await Promise.all([
          prisma.lead.count({ where: { assignedToId: bda.id } }),
          prisma.lead.count({ where: { assignedToId: bda.id, stage: 'Closed Won' } }),
          prisma.lead.aggregate({
            _sum: { dealValue: true },
            where: { assignedToId: bda.id, stage: 'Closed Won' }
          }),
          prisma.quotation.count({ where: { lead: { assignedToId: bda.id } } }),
        ]);
        const revenueGenerated = revenueResult._sum.dealValue || 0;
        const conversionRate = totalLeads > 0
          ? parseFloat(((closedDeals / totalLeads) * 100).toFixed(1))
          : 0;

        return { _id: bda.id, id: bda.id, name: bda.name, email: bda.email,
          totalLeads, quotationsCreated, closedDeals, revenueGenerated, conversionRate };
      })
    );

    leaderboard.sort((a, b) => b.revenueGenerated - a.revenueGenerated);
    res.json(leaderboard);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDashboardStats, getLeaderboard };
