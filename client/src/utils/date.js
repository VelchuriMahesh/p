export const formatDate = (value, options = {}) => {
  if (!value) {
    return 'N/A';
  }

  const date = value?.toDate ? value.toDate() : new Date(value);
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  }).format(date);
};

export const formatDateTime = (value) =>
  formatDate(value, {
    hour: 'numeric',
    minute: '2-digit',
  });

export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

export const getCountdownLabel = (expiresAt) => {
  if (!expiresAt) {
    return null;
  }

  const expiry = expiresAt?.toDate ? expiresAt.toDate() : new Date(expiresAt);
  const diff = expiry.getTime() - Date.now();

  if (diff <= 0) {
    return 'Ends today';
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days >= 1) {
    return `${days} day${days > 1 ? 's' : ''} left`;
  }

  return `${hours} hour${hours !== 1 ? 's' : ''} left`;
};

