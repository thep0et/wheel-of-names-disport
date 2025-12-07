/**
 * Uplup Wheel API Client
 * Handles all API calls to Uplup Wheel service
 */

export class UplupAPI {
  constructor(apiKey, apiSecret, baseUrl = 'https://api.uplup.com/api/wheel') {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.baseUrl = baseUrl;
  }

  /**
   * Get authorization header for API requests
   */
  getAuthHeader() {
    const credentials = Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64');
    return `Basic ${credentials}`;
  }

  /**
   * Make an API request
   */
  async request(endpoint, method = 'GET', body = null) {
    const url = `${this.baseUrl}${endpoint}`;

    const options = {
      method,
      headers: {
        'Authorization': this.getAuthHeader(),
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || `API request failed with status ${response.status}`);
    }

    return data;
  }

  /**
   * Create a new wheel
   */
  async createWheel(name, entries, settings = {}) {
    return this.request('/wheels', 'POST', {
      wheel_name: name,
      entries,
      settings: {
        spinnerDuration: 'normal',
        selectedColorSet: 'Vibrant',
        showTitle: true,
        removeAfterWin: false,
        ...settings
      }
    });
  }

  /**
   * Get wheel details
   */
  async getWheel(wheelId) {
    return this.request(`/wheels/${wheelId}`);
  }

  /**
   * Spin a wheel
   */
  async spinWheel(wheelId) {
    return this.request(`/wheels/${wheelId}/spin`, 'POST');
  }

  /**
   * List all wheels
   */
  async listWheels(limit = 10, offset = 0) {
    return this.request(`/wheels?limit=${limit}&offset=${offset}`);
  }

  /**
   * Update wheel entries
   */
  async updateWheelEntries(wheelId, entries) {
    return this.request(`/wheels/${wheelId}/entries`, 'PUT', { entries });
  }

  /**
   * Add entries to a wheel
   */
  async addEntries(wheelId, entries) {
    return this.request(`/wheels/${wheelId}/entries`, 'POST', { entries });
  }

  /**
   * Delete a wheel
   */
  async deleteWheel(wheelId) {
    return this.request(`/wheels/${wheelId}`, 'DELETE');
  }
}