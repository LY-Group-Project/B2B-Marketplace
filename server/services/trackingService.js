const axios = require('axios');

/**
 * Tracking Service for shipment tracking
 * Uses 17track API - free tier with excellent carrier support
 * Get API key: https://www.17track.net/en/apikey
 */

class TrackingService {
  constructor() {
    // 17track API configuration
    this.apiKey = process.env.TRACK17_API_KEY || '';
    this.apiUrl = 'https://api.17track.net/track/v2.2';
    
    // Carrier code mapping (17track carrier codes)
    this.carrierCodes = {
      'fedex': 70,
      'ups': 19,
      'usps': 41,
      'dhl': 29,
      'dhl-express': 29,
      'aramex': 122,
      'bluedart': 1070,
      'blue-dart': 1070,
      'delhivery': 2129,
      'dtdc': 1134,
      'india-post': 99,
      'professional-couriers': 2019,
      'xpressbees': 2130,
    };
  }

  /**
   * Validate tracking number format
   */
  validateTrackingNumber(trackingNumber, carrier) {
    if (!trackingNumber || typeof trackingNumber !== 'string') {
      return { valid: false, error: 'Tracking number is required' };
    }

    const trimmed = trackingNumber.trim().toUpperCase();
    
    // Basic validation - tracking numbers are typically 10-40 characters
    if (trimmed.length < 8 || trimmed.length > 40) {
      return { valid: false, error: 'Tracking number must be between 8 and 40 characters' };
    }

    // Carrier-specific validation patterns
    const patterns = {
      fedex: /^[0-9]{12,14}$/,
      ups: /^1Z[A-Z0-9]{16}$/,
      usps: /^(94|93|92|94|95)[0-9]{20}$|^[A-Z]{2}[0-9]{9}[A-Z]{2}$/,
      dhl: /^[0-9]{10,11}$/,
    };

    if (carrier && patterns[carrier.toLowerCase()]) {
      const pattern = patterns[carrier.toLowerCase()];
      if (!pattern.test(trimmed)) {
        return { 
          valid: false, 
          error: `Invalid ${carrier.toUpperCase()} tracking number format` 
        };
      }
    }

    return { valid: true, trackingNumber: trimmed };
  }

  /**
   * Get tracking information from API
   */
  async getTrackingInfo(trackingNumber, courierCode = null) {
    // Only use mock data if no API key is configured at all
    if (!this.apiKey) {
      console.log('No API key configured, using mock tracking data');
      return this.getMockTrackingData(trackingNumber, courierCode);
    }

    try {
      console.log(`Fetching tracking from 17track API for: ${trackingNumber}`);
      console.log(`Carrier code: ${courierCode || 'auto-detect'}`);
      
      // Step 1: Register tracking number
      // Reference: https://api.17track.net/en/doc/
      const registerPayload = [
        {
          number: trackingNumber,
          carrier: courierCode ? this.carrierCodes[courierCode] : 0, // 0 = auto-detect
        }
      ];

      await axios.post(
        `${this.apiUrl}/register`,
        registerPayload,
        {
          headers: {
            '17token': this.apiKey,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      // Step 2: Get tracking info (wait a moment for registration)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const trackPayload = [
        {
          number: trackingNumber,
        }
      ];

      const response = await axios.post(
        `${this.apiUrl}/gettrackinfo`,
        trackPayload,
        {
          headers: {
            '17token': this.apiKey,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      console.log('17track API response status:', response.status);
      console.log('17track API response data:', JSON.stringify(response.data, null, 2));

      if (response.data && response.data.data && response.data.data.accepted && response.data.data.accepted.length > 0) {
        console.log('Successfully fetched tracking data from 17track');
        const trackingData = response.data.data.accepted[0];
        return this.parse17trackResponse(trackingData);
      }

      // Check if there's an error message from 17track
      if (response.data && response.data.data && response.data.data.rejected) {
        console.log('17track rejected tracking:', response.data.data.rejected);
      }

      console.warn('No tracking information found in 17track response, using mock data');
      return this.getMockTrackingData(trackingNumber, courierCode);
    } catch (error) {
      console.error('17track API error:', error.response?.status, error.message);
      if (error.response?.data) {
        console.error('Error details:', JSON.stringify(error.response.data));
      }
      
      // Fallback to mock data in case of API error
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.warn('API authentication failed. Check your TRACK17_API_KEY. Using mock tracking data as fallback.');
      } else if (error.response?.status === 404) {
        console.warn('Tracking number not found in 17track. Using mock tracking data as fallback.');
      } else {
        console.warn('17track API request failed. Using mock tracking data as fallback.');
      }
      
      return this.getMockTrackingData(trackingNumber, courierCode);
    }
  }

  /**
   * Parse 17track API response
   */
  parse17trackResponse(tracking) {
    const track = tracking.track || {};
    const events = track.z1 || []; // z1 contains tracking events
    
    const trackingHistory = events.map(event => ({
      timestamp: new Date(event.a), // a = timestamp
      location: event.c || 'Unknown', // c = location
      status: this.get17trackStatus(event.z), // z = status code
      description: event.z || 'Package in transit', // z = description
      rawData: event,
    })).sort((a, b) => b.timestamp - a.timestamp);

    // Determine delivery status (status code mapping)
    const latestStatus = track.e || '';
    const isDelivered = latestStatus.includes('Delivered') || 
                       events.some(e => e.z && e.z.toLowerCase().includes('delivered'));

    // Get carrier info
    const carrier = tracking.carrier || {};
    console.log('17track carrier info:', carrier);
    return {
      success: true,
      carrier: carrier.w1 || 'Unknown Carrier', // w1 = carrier name
      courierCode: carrier.key || null,
      trackingNumber: tracking.number,
      status: track.e || 'In Transit', // e = latest status
      estimatedDelivery: null, // 17track doesn't provide ETA
      trackingHistory,
      lastUpdate: trackingHistory[0]?.timestamp || new Date(),
      isDelivered,
      sandboxMode: false,
      isMockData: false,
    };


  }

  /**
   * Map 17track status codes to readable status
   */
  get17trackStatus(statusText) {
    if (!statusText) return 'In Transit';
    
    const lower = statusText.toLowerCase();
    if (lower.includes('delivered')) return 'Delivered';
    if (lower.includes('out for delivery')) return 'Out for Delivery';
    if (lower.includes('picked up')) return 'Picked Up';
    if (lower.includes('in transit')) return 'In Transit';
    if (lower.includes('customs')) return 'In Customs';
    if (lower.includes('exception') || lower.includes('failed')) return 'Exception';
    
    return statusText;
  }

  /**
   * Mock tracking data for development/fallback
   * Used when 17track API is unavailable or not configured
   */
  getMockTrackingData(trackingNumber, courierCode = null) {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);

    // Detect carrier from tracking number if not provided
    const carrierInfo = courierCode
      ? this.getCarrierByCode(courierCode)
      : this.detectCarrier(trackingNumber);

    // Generate realistic tracking events
    const scenarios = [
      {
        status: 'Out for Delivery',
        history: [
          {
            timestamp: now.toISOString(),
            location: 'Mumbai, Maharashtra, India',
            status: 'Out for Delivery',
            description: 'Package is out for delivery - arriving today',
          },
          {
            timestamp: yesterday.toISOString(),
            location: 'Mumbai Sorting Facility, Maharashtra',
            status: 'In Transit',
            description: 'Arrived at local delivery facility',
          },
          {
            timestamp: twoDaysAgo.toISOString(),
            location: 'Delhi Distribution Center, Delhi',
            status: 'In Transit',
            description: 'Departed from regional hub',
          },
          {
            timestamp: threeDaysAgo.toISOString(),
            location: 'Delhi Processing Center, Delhi',
            status: 'In Transit',
            description: 'Package processed and ready for dispatch',
          },
          {
            timestamp: fourDaysAgo.toISOString(),
            location: 'Delhi, Delhi, India',
            status: 'Picked Up',
            description: 'Package picked up from seller',
          },
        ],
      },
      {
        status: 'In Transit',
        history: [
          {
            timestamp: now.toISOString(),
            location: 'Bangalore Hub, Karnataka',
            status: 'In Transit',
            description: 'Shipment in transit to destination city',
          },
          {
            timestamp: yesterday.toISOString(),
            location: 'Chennai Distribution Center, Tamil Nadu',
            status: 'In Transit',
            description: 'Package arrived at distribution center',
          },
          {
            timestamp: twoDaysAgo.toISOString(),
            location: 'Hyderabad, Telangana',
            status: 'Picked Up',
            description: 'Package collected from seller warehouse',
          },
        ],
      },
    ];

    // Use first scenario by default
    const scenario = scenarios[0];

    return {
      success: true,
      carrier: carrierInfo.carrier,
      courierCode: carrierInfo.courierCode,
      trackingNumber,
      status: scenario.status,
      estimatedDelivery: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      trackingHistory: scenario.history,
      lastUpdate: now,
      isDelivered: false,
      isMockData: true, // This is fallback mock data
      sandboxMode: false, // Not using real sandbox API
    };
  }

  /**
   * Get carrier information by code
   */
  getCarrierByCode(code) {
    const carriers = {
      'fedex': { carrier: 'FedEx', courierCode: 'fedex' },
      'ups': { carrier: 'UPS', courierCode: 'ups' },
      'usps': { carrier: 'USPS', courierCode: 'usps' },
      'dhl': { carrier: 'DHL Express', courierCode: 'dhl-express' },
      'dhl-express': { carrier: 'DHL Express', courierCode: 'dhl-express' },
      'bluedart': { carrier: 'Blue Dart', courierCode: 'bluedart' },
      'delhivery': { carrier: 'Delhivery', courierCode: 'delhivery' },
      'dtdc': { carrier: 'DTDC', courierCode: 'dtdc' },
      'india-post': { carrier: 'India Post', courierCode: 'india-post' },
      'xpressbees': { carrier: 'Xpressbees', courierCode: 'xpressbees' },
    };
    return carriers[code] || { carrier: 'Standard Carrier', courierCode: code };
  }

  /**
   * Detect carrier from tracking number format
   */
  detectCarrier(trackingNumber) {
    const trimmed = trackingNumber.trim().toUpperCase();

    // FedEx: 12-14 digits
    if (/^[0-9]{12,14}$/.test(trimmed)) {
      return { carrier: 'FedEx', courierCode: 'fedex' };
    }

    // UPS: Starts with 1Z
    if (/^1Z/.test(trimmed)) {
      return { carrier: 'UPS', courierCode: 'ups' };
    }

    // USPS: Various patterns
    if (/^(94|93|92|95)[0-9]{20}$/.test(trimmed) || /^[A-Z]{2}[0-9]{9}[A-Z]{2}$/.test(trimmed)) {
      return { carrier: 'USPS', courierCode: 'usps' };
    }

    // DHL: 10-11 digits
    if (/^[0-9]{10,11}$/.test(trimmed)) {
      return { carrier: 'DHL', courierCode: 'dhl-express' };
    }

    return { carrier: 'Unknown', courierCode: null };
  }

  /**
   * Update order tracking information
   */
  async updateOrderTracking(order) {
    const trackingNumber = order.tracking?.trackingNumber;
    const courierCode = order.tracking?.courierCode;

    if (!trackingNumber) {
      return { success: false, error: 'No tracking number provided' };
    }

    try {
      const trackingInfo = await this.getTrackingInfo(trackingNumber, courierCode);

      if (trackingInfo.success) {
        // Update order with latest tracking info
        if (!order.tracking) {
          order.tracking = {};
        }

        order.tracking.trackingHistory = trackingInfo.trackingHistory;
        order.tracking.lastUpdated = new Date();
        order.tracking.courierCode = trackingInfo.courierCode;

        if (!order.tracking.carrier && trackingInfo.carrier) {
          order.tracking.carrier = trackingInfo.carrier;
        }

        // Auto-update order status if delivered
        if (trackingInfo.isDelivered && order.status === 'shipped') {
          order.status = 'delivered';
        }

        if (typeof order.save === 'function') {
          await order.save();
        }

        return {
          success: true,
          trackingInfo,
          message: 'Tracking information updated successfully',
        };
      }

      return trackingInfo;
    } catch (error) {
      console.error('Update tracking error:', error);
      return {
        success: false,
        error: error.message || 'Failed to update tracking information',
      };
    }
  }

  /**
   * Get list of supported carriers
   */
  getSupportedCarriers() {
    return [
      { name: 'FedEx', code: 'fedex' },
      { name: 'UPS', code: 'ups' },
      { name: 'USPS', code: 'usps' },
      { name: 'DHL Express', code: 'dhl-express' },
      { name: 'Aramex', code: 'aramex' },
      { name: 'Blue Dart', code: 'bluedart' },
      { name: 'Delhivery', code: 'delhivery' },
      { name: 'DTDC', code: 'dtdc' },
      { name: 'India Post', code: 'india-post' },
      { name: 'Professional Couriers', code: 'professional-couriers' },
      { name: 'Xpressbees', code: 'xpressbees' },
    ];
  }
}

module.exports = new TrackingService();
