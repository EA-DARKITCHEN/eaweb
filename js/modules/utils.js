// Función helper para escapar HTML
export function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Función para asegurar codificación UTF-8
export function ensureUTF8(text) {
  try {
    const normalized = text.normalize('NFC');
    
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(normalized, 'utf8').toString('utf8');
    }
    
    const encoder = new TextEncoder();
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(encoder.encode(normalized));
    
  } catch (error) {
    console.warn('Error en codificación UTF-8:', error);
    return text;
  }
}

// Función para validar teléfono
export function validatePhone(phone) {
  return /^[0-9]{10,15}$/.test(phone);
}

// Función para formatear dinero
export function formatMoney(amount) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount);
}

// Función debounce para eventos
export function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}