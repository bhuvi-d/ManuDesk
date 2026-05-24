const express = require('express');
const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const {
  login,
  getMe,
  registerUser,
  getBDAs,
  getAllUsers,
} = require('../controllers/authController');

const {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead
} = require('../controllers/leadController');

const {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient
} = require('../controllers/clientController');

const {
  getQuotations,
  getQuotationById,
  createQuotation,
  updateQuotation
} = require('../controllers/quotationController');

const {
  getActivities,
  createActivity
} = require('../controllers/activityController');

const {
  getDashboardStats,
  getLeaderboard
} = require('../controllers/analyticsController');

const {
  getNotifications
} = require('../controllers/notificationController');

const {
  globalSearch
} = require('../controllers/searchController');

// Authentication Routes
router.post('/auth/login', login);
router.get('/auth/me', protect, getMe);

// User Management Routes
router.post('/users', protect, authorize('Admin'), registerUser);
router.get('/users', protect, authorize('Admin'), getAllUsers);
router.get('/users/bdas', protect, getBDAs);

// Leads Routes
router.route('/leads')
  .get(protect, getLeads)
  .post(protect, createLead);
router.route('/leads/:id')
  .get(protect, getLeadById)
  .put(protect, updateLead)
  .delete(protect, deleteLead);

// Clients Routes
router.route('/clients')
  .get(protect, getClients)
  .post(protect, createClient);
router.route('/clients/:id')
  .get(protect, getClientById)
  .put(protect, updateClient)
  .delete(protect, deleteClient);

// Quotations Routes
router.route('/quotations')
  .get(protect, getQuotations)
  .post(protect, createQuotation);
router.route('/quotations/:id')
  .get(protect, getQuotationById)
  .put(protect, updateQuotation);

// Activities Routes
router.route('/activities')
  .get(protect, getActivities)
  .post(protect, createActivity);

// Analytics Routes
router.get('/analytics/dashboard', protect, getDashboardStats);
router.get('/analytics/leaderboard', protect, getLeaderboard);

// Notifications Route
router.get('/notifications', protect, getNotifications);

// Global Search Route
router.get('/search', protect, globalSearch);

module.exports = router;
