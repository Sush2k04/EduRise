/**
 * Format a date as a relative time string
 * Examples: "just now", "2 mins ago", "Yesterday", "Mar 26, 3:45 PM"
 */
export const getRelativeTime = (dateStr) => {
  if (!dateStr) return '';
  
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  // Less than 1 minute
  if (diffMins < 1) {
    return 'just now';
  }
  
  // Less than 1 hour
  if (diffMins < 60) {
    return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  }
  
  // Less than 24 hours
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  }
  
  // Yesterday
  if (diffDays === 1) {
    return 'Yesterday';
  }
  
  // Less than 1 week
  if (diffDays < 7) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }
  
  // Format as "Mar 26, 3:45 PM"
  const options = { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', meridiem: 'short' };
  return date.toLocaleDateString('en-US', options);
};

/**
 * Format notification message based on type and payload
 * Returns a user-friendly message
 */
export const formatNotificationMessage = (notification) => {
  const { type, payload } = notification;
  const username = payload?.username || payload?.fromUser || 'Someone';
  
  switch (type) {
    case 'connection_request':
      return `${username} sent you a connection request`;
    case 'connection_accepted':
      return `${username} accepted your connection request`;
    case 'session_invite':
      return `${username} invited you to a learning session`;
    default:
      return `${type} from ${username}`;
  }
};

/**
 * Format a decimal score (0-1) as a whole-number percentage
 * Examples: 0.2323 -> 23%, 0.456 -> 46%
 */
export const formatScoreAsPercentage = (score) => {
  if (score === null || score === undefined) return '0%';
  const percentage = Math.round(score * 100);
  return `${percentage}%`;
};
