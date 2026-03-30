// Client Configuration
// This file centralizes all API endpoints and configuration
// For production, these values can be overridden via environment variables

const config = {
  // API Base URL
  // In development: uses localhost
  // In production: set via REACT_APP_API_URL environment variable
  apiBaseUrl: (process.env.REACT_APP_API_URL || "http://localhost:5000"),
  
  // API Endpoints
  api: {
    // Auth endpoints
    login: '/api/auth/login',
    register: '/api/auth/register',
    
    // Items endpoints
    items: '/api/items',
    itemsSearch: '/api/items/search',
    itemsAdvancedSearch: '/api/items/advanced-search',
    itemsPurchase: '/api/items/purchase',
    itemsStockTotal: '/api/items/stock/total-amount',
    itemsStockTotalByBrand: '/api/items/stock/total-amount-by-brand',
    itemsDetails: '/api/items/details',
    
    // Parties endpoints
    buyers: '/api/parties/buyers',
    buyersRetail: '/api/parties/buyers/retail',
    sellers: '/api/parties/sellers',
    sellersRetail: '/api/parties/sellers/retail',
    dueSheet: '/api/parties/sellers/due-sheet',
    dueAlerts: '/api/parties/sellers/due-alerts',
    
    // Transactions endpoints
    sale: '/api/transactions/sale',
    return: '/api/transactions/return',

    /** Unified ledger per party (seller/creditor or buyer) */
    unifiedTransactionsParty: (partyType, partyId) => `/api/unified-transactions/party/${partyType}/${partyId}`,
    
    // Reports endpoints
    salesReport: '/api/reports/sales',
    salesByAttendant: '/api/reports/sales/by-attendant',
    salesByNozzle: '/api/reports/sales/by-nozzle',
    salesReportExport: '/api/reports/sales/export',
    salesBillDetails: (billNumber) => `/api/reports/sales/bill/${billNumber}`,
    itemWiseSalesReport: '/api/reports/sales/items',
    itemWiseSalesReportExport: '/api/reports/sales/items/export',
    returnsReport: '/api/reports/returns',
    returnsReportExport: '/api/reports/returns/export',
    returnsBillDetails: (identifier) => `/api/reports/returns/bill/${identifier}`,
    
    // Nozzles & attendants (petrol pump)
    nozzles: '/api/nozzles',
    attendants: '/api/attendants',
    nozzleReadings: '/api/nozzle-readings',

    // Orders endpoints
    orders: '/api/orders',
    ordersExport: '/api/orders/export',
    orderComplete: (id) => `/api/orders/${id}/complete`,
    
    // Bills endpoints
    billPdf: (id) => `/api/bills/${id}/pdf`,
    
    // Health check
    health: '/api/health'
  },
  
  // App Configuration
  app: {
    name: 'Steepray Info Solutions',
    version: '1.0.0',
    /** Batch size for some list fetches; paginated reports typically use 50 and match server defaults */
    defaultPageSize: 200,
    /** 'petrol_pump' = use nozzle-to-tank loader for all loading/processing states */
    theme: 'petrol_pump'
  },
  
  // Feature Flags
  features: {
    enableAdvancedSearch: true,
    enableExcelExport: true,
    enablePdfExport: true
  }
};

// Helper function to get full API URL
export const getApiUrl = (endpoint) => {
  // Handle function endpoints (like orderComplete, billPdf)
  if (typeof endpoint === 'function') {
    return (params) => `${config.apiBaseUrl}${endpoint(params)}`;
  }
  return `${config.apiBaseUrl}${endpoint}`;
};

// Helper function to get API endpoint
export const getApiEndpoint = (key, ...params) => {
  const endpoint = config.api[key];
  if (typeof endpoint === 'function') {
    return `${config.apiBaseUrl}${endpoint(...params)}`;
  }
  return `${config.apiBaseUrl}${endpoint}`;
};

export default config;


