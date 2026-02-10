/**
 * Helper function to extract data from API response
 * Handles different response structures:
 * - response.data (array)
 * - response.data.data (pagination object with data array)
 * - response.data.data.data (nested structure)
 */
export function extractDataFromResponse(response) {
  if (!response || !response.data) {
    return [];
  }

  // If response.data is already an array, return it
  if (Array.isArray(response.data)) {
    return response.data;
  }

  // If response.data has a data property
  if (response.data.data) {
    // If data.data is an array, return it
    if (Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    // Handle nested structure: response.data.data.data
    if (response.data.data.data && Array.isArray(response.data.data.data)) {
      return response.data.data.data;
    }
  }

  // Fallback to empty array
  return [];
}




