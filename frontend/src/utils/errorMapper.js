/**
 * Maps Axios errors to human-readable strings.
 * @param {Error} error 
 * @returns {string}
 */
export function getErrorMessage(error) {
  if (error.response?.data?.message) {
    if (Array.isArray(error.response.data.message)) {
      return error.response.data.message[0]
    }
    return error.response.data.message
  }
  
  if (error.message) return error.message
  
  return 'An unexpected error occurred'
}
