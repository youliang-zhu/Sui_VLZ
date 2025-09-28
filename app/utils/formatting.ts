// Formatting utility functions for Shallot system

// ===== Address and Object ID Formatting =====

/**
 * Format Sui address for display (shortened with ellipsis)
 */
export function formatAddress(
  address: string, 
  prefixLength: number = 6, 
  suffixLength: number = 4
): string {
  if (!address) return '';
  
  if (address.length <= prefixLength + suffixLength) {
    return address;
  }
  
  return `${address.slice(0, prefixLength)}...${address.slice(-suffixLength)}`;
}

/**
 * Format object ID for display (shortened with ellipsis)
 */
export function formatObjectId(
  objectId: string, 
  prefixLength: number = 8, 
  suffixLength: number = 6
): string {
  if (!objectId) return '';
  
  if (objectId.length <= prefixLength + suffixLength) {
    return objectId;
  }
  
  return `${objectId.slice(0, prefixLength)}...${objectId.slice(-suffixLength)}`;
}

/**
 * Format full address with 0x prefix
 */
export function formatFullAddress(address: string): string {
  if (!address) return '';
  
  // Ensure 0x prefix
  if (!address.startsWith('0x')) {
    return `0x${address}`;
  }
  
  return address;
}

// ===== Time and Date Formatting =====

/**
 * Format timestamp to human readable date
 */
export function formatDate(timestamp: number, options?: Intl.DateTimeFormatOptions): string {
  if (!timestamp || timestamp <= 0) return 'Unknown';
  
  const date = new Date(timestamp);
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  };
  
  return date.toLocaleDateString('en-US', defaultOptions);
}

/**
 * Format timestamp to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(timestamp: number): string {
  if (!timestamp || timestamp <= 0) return 'Unknown';
  
  const now = Date.now();
  const diff = now - timestamp;
  
  // Less than 1 minute
  if (diff < 60 * 1000) {
    return 'Just now';
  }
  
  // Less than 1 hour
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000));
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }
  
  // Less than 1 day
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000));
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }
  
  // Less than 1 week
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }
  
  // Less than 1 month
  if (diff < 30 * 24 * 60 * 60 * 1000) {
    const weeks = Math.floor(diff / (7 * 24 * 60 * 60 * 1000));
    return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  }
  
  // Fallback to formatted date
  return formatDate(timestamp, { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Format duration in milliseconds to human readable format
 */
export function formatDuration(durationMs: number): string {
  if (!durationMs || durationMs <= 0) return '0 seconds';
  
  const seconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    const remainingHours = hours % 24;
    if (remainingHours > 0) {
      return `${days} day${days === 1 ? '' : 's'} ${remainingHours} hour${remainingHours === 1 ? '' : 's'}`;
    }
    return `${days} day${days === 1 ? '' : 's'}`;
  }
  
  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    if (remainingMinutes > 0) {
      return `${hours} hour${hours === 1 ? '' : 's'} ${remainingMinutes} minute${remainingMinutes === 1 ? '' : 's'}`;
    }
    return `${hours} hour${hours === 1 ? '' : 's'}`;
  }
  
  if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    if (remainingSeconds > 0) {
      return `${minutes} minute${minutes === 1 ? '' : 's'} ${remainingSeconds} second${remainingSeconds === 1 ? '' : 's'}`;
    }
    return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  }
  
  return `${seconds} second${seconds === 1 ? '' : 's'}`;
}

/**
 * Format time remaining until a future timestamp
 */
export function formatTimeRemaining(endTime: number, currentTime?: number): string {
  const now = currentTime || Date.now();
  const remaining = endTime - now;
  
  if (remaining <= 0) {
    return 'Ended';
  }
  
  return formatDuration(remaining) + ' remaining';
}

// ===== Number and Percentage Formatting =====

/**
 * Format number with thousands separators
 */
export function formatNumber(num: number, options?: Intl.NumberFormatOptions): string {
  if (typeof num !== 'number' || isNaN(num)) return '0';
  
  return num.toLocaleString('en-US', options);
}

/**
 * Format percentage with specified decimal places
 */
export function formatPercentage(
  value: number, 
  total: number, 
  decimalPlaces: number = 1
): string {
  if (total === 0) return '0%';
  
  const percentage = (value / total) * 100;
  return `${percentage.toFixed(decimalPlaces)}%`;
}

/**
 * Format vote count display
 */
export function formatVoteCount(count: number): string {
  if (count === 0) return 'No votes';
  if (count === 1) return '1 vote';
  return `${formatNumber(count)} votes`;
}

/**
 * Format member count display
 */
export function formatMemberCount(count: number): string {
  if (count === 0) return 'No members';
  if (count === 1) return '1 member';
  return `${formatNumber(count)} members`;
}

// ===== Text Formatting =====

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  
  if (text.length <= maxLength) return text;
  
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Capitalize first letter of each word
 */
export function capitalizeWords(text: string): string {
  if (!text) return '';
  
  return text
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Convert camelCase to human readable format
 */
export function camelCaseToHuman(text: string): string {
  if (!text) return '';
  
  return text
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

// ===== Status and Badge Formatting =====

/**
 * Format poll status for display
 */
export function formatPollStatus(status: string): string {
  switch (status.toLowerCase()) {
    case 'active':
      return 'Active';
    case 'ended':
      return 'Ended';
    case 'executed':
      return 'Executed';
    case 'failed':
      return 'Failed';
    default:
      return capitalizeWords(status);
  }
}

/**
 * Get status color class for UI
 */
export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'active':
      return 'text-green-600 bg-green-100';
    case 'ended':
      return 'text-blue-600 bg-blue-100';
    case 'executed':
      return 'text-purple-600 bg-purple-100';
    case 'failed':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

// ===== File Size Formatting =====

/**
 * Format file size in bytes to human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// ===== Hash and Anonymous ID Formatting =====

/**
 * Format anonymous voter ID (hash) for display
 */
export function formatAnonymousId(hash: number[]): string {
  if (!hash || hash.length === 0) return '';
  
  // Convert first 8 bytes to hex string
  const hexString = hash
    .slice(0, 8)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
    
  return `anonymous_${hexString}`;
}

/**
 * Format password hash for display (very short)
 */
export function formatPasswordHash(hash: number[]): string {
  if (!hash || hash.length === 0) return '';
  
  const hexString = hash
    .slice(0, 4)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
    
  return `hash_${hexString}`;
}

// ===== URL and Link Formatting =====

/**
 * Format explorer URL for object
 */
export function formatExplorerUrl(
  objectId: string, 
  network: 'mainnet' | 'testnet' | 'devnet' = 'testnet'
): string {
  const baseUrl = network === 'mainnet' 
    ? 'https://suiexplorer.com'
    : `https://suiexplorer.com/?network=${network}`;
    
  return `${baseUrl}/object/${objectId}`;
}

/**
 * Format explorer URL for transaction
 */
export function formatTransactionUrl(
  digest: string, 
  network: 'mainnet' | 'testnet' | 'devnet' = 'testnet'
): string {
  const baseUrl = network === 'mainnet' 
    ? 'https://suiexplorer.com'
    : `https://suiexplorer.com/?network=${network}`;
    
  return `${baseUrl}/txblock/${digest}`;
}

// ===== Validation Message Formatting =====

/**
 * Format validation error message
 */
export function formatValidationError(field: string, error: string): string {
  const fieldName = camelCaseToHuman(field);
  return `${fieldName}: ${error}`;
}

/**
 * Format multiple validation errors
 */
export function formatValidationErrors(errors: Record<string, string>): string[] {
  return Object.entries(errors).map(([field, error]) => 
    formatValidationError(field, error)
  );
}