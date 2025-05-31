import { escapeHtml } from './utils.js';

export class UIHandler {
  constructor() {
    this.elements = {};
  }
  
  initElements() {
    this.elements = {
      clientName: document.getElementById('client-name'),
      clientPhone: document.getElementById('client-phone'),
      orderNotes: document.getElementById('order-notes'),
      summaryItems: document.getElementById('summary-items'),
      orderTotal: document.getElementById('order-total'),
      saveBtn: document.getElementById('saveOrderBtn'),
      whatsappBtn: document.getElementById('whatsappBtn'),
      newOrderBtn: document.getElementById('newOrderBtn'),
      statsBtn: document.getElementById('statsBtn'),
      toggleSummary: document.getElementById('toggleSummary'),
      summaryContent: document.getElementById('summaryContent'),
      collapsedItemCount: document.getElementById('collapsed-item-count'),
      collapsedTotal: document.getElementById('collapsed-total')
    };
  }
  
  bindButtonEvents(handlers) {
    const buttons = {
      save: this.elements.saveBtn,
      whatsapp: this.elements.whatsappBtn,
      newOrder: this.elements.newOrderBtn,
      stats: this.elements.statsBtn,
      toggleSummary: this.elements.toggleSummary
    };
    
    Object.entries(handlers).forEach(([key, handler]) => {
      if (buttons[key]) {
        buttons[key].addEventListener('click', handler);
      }
    });
  }
  
  setupInputEvents(callback) {
    [this.elements.clientName, this.elements.clientPhone].forEach(el => {
      if (el) {
        el.addEventListener('input', () => {
          clearTimeout(this.debounceTimer);
          this.debounceTimer = setTimeout(callback, 150);
        });
      }
    });
    
    if (this.elements.orderNotes) {
      this.elements.orderNotes.addEventListener('input', callback);
    }
  }
  

updateOrderSummary(order) {
  if (!this.elements.summaryItems || !this.elements.orderTotal) return;
  
  const fragment = document.createDocumentFragment();
  
  order.items.forEach((item, index) => {
    const itemEl = document.createElement('div');
    itemEl.className = 'summary-item';
    itemEl.innerHTML = `
      <div class="item-info">
        <span>${item.quantity}x ${escapeHtml(item.name)}</span>
        <span>$${(item.price * item.quantity).toFixed(2)}</span>
      </div>
      <button class="remove-item" data-index="${index}">
        <i class="fas fa-trash"></i>
      </button>
    `;
    fragment.appendChild(itemEl);
  });
  
  this.elements.summaryItems.innerHTML = '';
  this.elements.summaryItems.appendChild(fragment);
  
  // Asegúrate que esta línea esté actualizando el total correctamente
  this.elements.orderTotal.textContent = `$${order.total.toFixed(2)}`;
  
  this.updateCollapsedSummary(order);
}
  
  updateCollapsedSummary(order) {
    if (!this.elements.collapsedItemCount || !this.elements.collapsedTotal) return;
    
    const itemCount = order.items.reduce((total, item) => total + item.quantity, 0);
    const itemText = itemCount === 1 ? 'producto' : 'productos';
    
    this.elements.collapsedItemCount.textContent = `${itemCount} ${itemText}`;
    this.elements.collapsedTotal.textContent = `$${order.total.toFixed(2)}`;
  }
  
  toggleSummary() {
    if (!this.elements.summaryContent || !this.elements.toggleSummary) return;
    
    const content = this.elements.summaryContent;
    const icon = this.elements.toggleSummary.querySelector('i');
    const isExpanded = content.classList.contains('expanded');
    
    if (isExpanded) {
      content.classList.replace('expanded', 'collapsed');
      if (icon) icon.classList.replace('fa-chevron-down', 'fa-chevron-up');
    } else {
      content.classList.replace('collapsed', 'expanded');
      if (icon) icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
    }
  }
  
  switchTab(btn) {
    const tab = btn.getAttribute('data-tab');
    if (!tab) return;
    
    document.querySelectorAll('.tab-btn.active').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content.active').forEach(c => c.classList.remove('active'));
    
    btn.classList.add('active');
    const tabContent = document.getElementById(tab);
    if (tabContent) tabContent.classList.add('active');
  }
  
  restoreFormFields(client, notes) {
    if (this.elements.clientName) this.elements.clientName.value = client.name || '';
    if (this.elements.clientPhone) this.elements.clientPhone.value = client.phone || '';
    if (this.elements.orderNotes) this.elements.orderNotes.value = notes || '';
  }
  
  showAlert(message) {
    alert(message);
  }
  
  showCopyModal(content, title = '') {
    const modal = document.createElement('div');
    modal.className = 'copy-modal';
    modal.innerHTML = `
      <div class="modal-content">
        ${title ? `<h3>${title}</h3>` : ''}
        <textarea readonly>${content}</textarea>
        <button class="close-modal">Cerrar</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    const textarea = modal.querySelector('textarea');
    textarea.select();
    
    try {
      document.execCommand('copy');
      this.showAlert('Mensaje copiado al portapapeles');
    } catch (e) {
      console.warn('No se pudo copiar automáticamente');
    }
    
    modal.querySelector('.close-modal').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
  }
}