import { ensureUTF8, escapeHtml } from './utils.js';

export class WhatsAppHandler {
  constructor(orderManager) {
    this.orderManager = orderManager;
  }
  
  send() {
    if (!this.validateOrder()) return false;
    
    this.generateOrderCodeIfNeeded();
    
    if (!confirm(this.getConfirmationMessage())) {
      return false;
    }
    
    try {
      const message = this.formatMessage();
      const url = this.createWhatsAppUrl(message);
      
      if (!this.openWhatsApp(url)) {
        this.showCopyFallback(message);
      } else {
        setTimeout(() => {
          this.orderManager.resetAfterSend();
        }, 1000);
      }
      
      return true;
    } catch (error) {
      console.error('Error al enviar WhatsApp:', error);
      this.orderManager.ui.showAlert('Error al generar el mensaje');
      return false;
    }
  }
  
  validateOrder() {
    if (this.orderManager.currentOrder.items.length === 0) {
      this.orderManager.ui.showAlert('Agrega al menos un producto');
      return false;
    }
    return true;
  }
  
  generateOrderCodeIfNeeded() {
    if (!this.orderManager.currentOrder.code) {
      this.orderManager.currentOrder.code = this.generateOrderCode();
      this.orderManager.currentOrder.timestamp = new Date().toISOString();
    }
  }
  
  generateOrderCode() {
    const now = new Date();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear().toString().slice(-2);
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    return `EA-${month}${year}-${randomPart}`;
  }
  
  getConfirmationMessage() {
    return `¿Enviar pedido ${this.orderManager.currentOrder.code} a WhatsApp?\n\nRevise la información antes de enviar.`;
  }
  
  // Método para obtener el emoji según el ID del producto
  getProductEmoji(item) {
    const productId = item.id;
    
    // Mapeo basado en los IDs de tu ProductManager
    if (productId >= 1 && productId <= 5) {
      // Alitas (IDs 1-5)
      return '🍗';
    } else if (productId >= 6 && productId <= 9) {
      // Boneless (IDs 6-9)
      return '🍗';
    } else if (productId >= 10 && productId <= 12) {
      // Papas (IDs 10-12)
      return '🍟';
    } else if (productId >= 13 && productId <= 17) {
      // Bebidas (IDs 13-17)
      return '🥤';
    }
    
    // Fallback: detectar por nombre si el ID no coincide
    const productName = item.name ? item.name.toLowerCase() : '';
    
    if (productName.includes('papa') || productName.includes('fries')) {
      return '🍟';
    }
    
    if (productName.includes('frappe') || productName.includes('refresco') || 
        productName.includes('agua') || productName.includes('bebida')) {
      return '🥤';
    }
    
    // Por defecto, emoji de pollo
    return '🍗';
  }
  
  formatMessage() {
    const emojis = {
      shopping: '🛍️',
      package: '📦',
      person: '👤',
      phone: '📞',
      money: '💵',
      note: '📝',
      card: '💳',
      cash: '💰',
      bank: '🏦',
      check: '✅',
      bullet: '•'
    };
    
    const { client, items, notes, code, total } = this.orderManager.currentOrder;
    
    const itemsText = items.map(item => {
      const productEmoji = this.getProductEmoji(item);
      return `${productEmoji} *${item.quantity}x* ${escapeHtml(item.name)} - $${(item.price * item.quantity).toFixed(2)}`;
    }).join('\n');
    
    let message = `${emojis.shopping} *Nuevo Pedido - EntreAlas* ${emojis.shopping}\n\n` +
      `${emojis.package} *Código:* ${code}\n\n`;
    
    if (client.name) message += `${emojis.person} *Cliente:* ${client.name}\n`;
    if (client.phone) message += `${emojis.phone} *Teléfono:* ${client.phone}\n`;
    if (client.name || client.phone) message += `\n`;
    
    message += `${emojis.package} *Detalle:*\n${itemsText}\n\n` +
      `${emojis.money} *Total:* $${total.toFixed(2)}\n`;
    
    if (notes) message += `\n${emojis.note} *Notas:* ${notes}\n`;
    
    message += `\n${emojis.card} *Métodos de pago:*\n` +
      `${emojis.bullet} Efectivo ${emojis.cash}\n` +
      `${emojis.bullet} Transferencia ${emojis.bank}\n` +
      `${emojis.bullet} Tarjetas ${emojis.card}\n\n` +
      `${emojis.check} ¡Gracias por tu pedido!`;
    
    return ensureUTF8(message);
  }
  
  createWhatsAppUrl(message) {
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  }
  
  openWhatsApp(url) {
    try {
      const newWindow = window.open(url, '_blank');
      if (newWindow) return true;
      
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    } catch (error) {
      console.error('Error al abrir WhatsApp:', error);
      return false;
    }
  }
  
  showCopyFallback(message) {
    this.orderManager.ui.showCopyModal(message, 'Copie el mensaje para enviarlo manualmente por WhatsApp');
  }
}
