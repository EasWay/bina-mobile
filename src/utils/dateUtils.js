/**
 * Format date to user-friendly format for mobile
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
  if (!date) return 'No date';
  
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'Invalid date';
    
    return dateObj.toLocaleDateString('en-GH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

/**
 * Format date to short format (DD/MM/YYYY)
 * @param {string|Date} date - Date to format
 * @returns {string} Short formatted date string
 */
export const formatDateShort = (date) => {
  if (!date) return 'No date';
  
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'Invalid date';
    
    return dateObj.toLocaleDateString('en-GH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}; 

/**
 * Get time-based greeting based on current hour
 * @returns {string} Appropriate greeting for the time of day
 */
export const getTimeBasedGreeting = () => {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) {
    return "Good morning! 👋";
  } else if (hour >= 12 && hour < 17) {
    return "Good afternoon! 👋";
  } else if (hour >= 17 && hour < 21) {
    return "Good evening! 👋";
  } else {
    return "Good night! 👋";
  }
}; 