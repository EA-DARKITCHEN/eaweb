import { ProductManager } from './productManager.js';
import { SpecialOrderHandler } from './specialOrders.js';
import { WhatsAppHandler } from './whatsapp.js';
import { UIHandler } from './ui.js';
import { StorageHandler } from './storage.js';
import { escapeHtml } from './utils.js';

export class OrderManager {
  constructor() {
    // Inicializar módulos
    this.storage = new StorageHandler('orderData');
    this.ui = new UIHandler();
    this.products = new ProductManager();
    this.specialOrderHandler = new SpecialOrderHandler(this);
    this.whatsappHandler = new WhatsAppHandler(this);

    // Estado inicial
    this.currentOrder = this.createEmptyOrder();
    this.orderCounter = 1;
    this.debounceTimer = null;

    // Inicialización
    this.init();
  }

  init() {
    this.ui.initElements();
    this.products.renderAll();
    this.initEvents();
    this.loadFromLocalStorage();
  }

  createEmptyOrder() {
    return {
      client: { name: '', phone: '' },
      items: [],
      notes: '',
      status: 'pending',
      total: 0,
      code: '',
      timestamp: null
    };
  }

  initEvents() {
    // Delegación de eventos
    document.addEventListener('click', this.handleDocumentClick.bind(this));

    // Eventos de UI
    this.ui.bindButtonEvents({
      save: () => this.saveOrder(),
      whatsapp: () => this.sendWhatsApp(),
      newOrder: () => this.resetOrder(),
      stats: () => this.showStats(),
      toggleSummary: () => this.ui.toggleSummary()
    });

    // Eventos de inputs
    this.ui.setupInputEvents(() => this.updateClientData());
  }

  handleDocumentClick(e) {
    const target = e.target;

    // Manejar tabs
    if (target.classList.contains('tab-btn')) {
      this.ui.switchTab(target);
      return;
    }

    // Manejar botones de cantidad
    if (target.classList.contains('qty-btn') && target.closest('.product-card')) {
      this.handleQuantityChange(target);
      return;
    }

    // Manejar eliminación de items
    if (target.closest('.remove-item')) {
      e.stopPropagation();
      const btn = target.closest('.remove-item');
      const index = parseInt(btn.dataset.index);
      if (!isNaN(index)) {
        this.removeItem(index);
      }
    }
  }

  handleQuantityChange(btn) {
    const card = btn.closest('.product-card');
    if (!card) return;

    const productId = card.dataset.id;
    const cachedCard = this.products.productCards.get(productId);

    if (!cachedCard) return;

    let qty = parseInt(cachedCard.qtyElement.textContent) || 0;
    const isPlus = btn.classList.contains('plus');

    qty = isPlus ? qty + 1 : Math.max(qty - 1, 0);
    cachedCard.qtyElement.textContent = qty;

    this.updateOrderItem(productId, qty);
  }

  updateOrderItem(productId, quantity) {
    const product = this.products.productCache.get(productId);
    if (!product) return;

    const existingIndex = this.currentOrder.items.findIndex(item => item.id === productId);

    if (quantity === 0) {
      // Remover item
      if (existingIndex !== -1) {
        this.currentOrder.items.splice(existingIndex, 1);
      }
    } else {
      // Actualizar o agregar item
      const itemData = {
        id: productId,
        name: product.name,
        price: product.price,
        quantity: quantity
      };

      if (existingIndex !== -1) {
        this.currentOrder.items[existingIndex] = itemData;
      } else {
        this.currentOrder.items.push(itemData);
      }
    }

    this.updateOrderTotal();
    this.saveToLocalStorage();
  }

  updateOrderTotal() {
    this.currentOrder.total = this.currentOrder.items.reduce(
      (total, item) => total + (item.price * item.quantity), 0
    );

    this.ui.updateOrderSummary(this.currentOrder);
  }

  removeItem(index) {
    if (index < 0 || index >= this.currentOrder.items.length) return;

    const removedItem = this.currentOrder.items[index];

    // Restar del total
    this.currentOrder.total -= removedItem.price * removedItem.quantity;

    if (removedItem && !removedItem.isSpecial) {
      const cachedCard = this.products.productCards.get(removedItem.id);
      if (cachedCard) cachedCard.qtyElement.textContent = '0';
    }

    this.currentOrder.items.splice(index, 1);
    this.updateOrderTotal(); // Esto ahora actualizará correctamente la UI
    this.saveToLocalStorage();
  }

  updateClientData() {
    this.currentOrder.client = {
      name: this.ui.elements.clientName?.value.trim() || '',
      phone: this.ui.elements.clientPhone?.value.trim() || ''
    };

    if (this.ui.elements.orderNotes) {
      this.currentOrder.notes = this.ui.elements.orderNotes.value.trim();
    }

    this.saveToLocalStorage();
  }

  validateOrder() {
    if (this.currentOrder.items.length === 0) {
      this.ui.showAlert('Debe agregar al menos un producto');
      return false;
    }

    const { name, phone } = this.currentOrder.client;
    if (!name && !phone) {
      const proceed = confirm('No se han ingresado datos del cliente. ¿Desea continuar?');
      if (!proceed) return false;
    }

    return true;
  }

  saveOrder() {
    if (!this.validateOrder()) return;

    if (!this.currentOrder.code) {
      this.currentOrder.code = this.generateOrderCode();
      this.currentOrder.timestamp = new Date().toISOString();
    }

    try {
      const orderData = {
        ...this.currentOrder,
        specialOrder: this.specialOrderHandler.getData()
      };

      this.storage.save(orderData);
      this.ui.showAlert(`Pedido ${this.currentOrder.code} guardado correctamente`);
    } catch (error) {
      console.error('Error al guardar pedido:', error);
      this.ui.showAlert('Error al guardar el pedido');
    }
  }

  generateOrderCode() {
    const now = new Date();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear().toString().slice(-2);
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    return `EA-${month}${year}-${randomPart}`;
  }

  sendWhatsApp() {
    return this.whatsappHandler.send();
  }

  resetOrder() {
    const confirmMsg = '¿Está seguro de comenzar un nuevo pedido? Se perderán los datos no guardados.';
    if (!confirm(confirmMsg)) return;

    this.currentOrder = this.createEmptyOrder();
    this.specialOrderHandler.reset();

    // Resetear cantidades de productos
    this.products.productCards.forEach(card => {
      card.qtyElement.textContent = '0';
    });

    // Limpiar UI
    this.ui.updateOrderSummary(this.currentOrder);
    this.ui.restoreFormFields({ name: '', phone: '' }, '');

    this.clearLocalStorage();
  }

  resetAfterSend() {
    this.currentOrder = this.createEmptyOrder();
    this.specialOrderHandler.reset();

    // Limpiar campos
    this.ui.elements.clientName && (this.ui.elements.clientName.value = '');
    this.ui.elements.clientPhone && (this.ui.elements.clientPhone.value = '');
    this.ui.elements.orderNotes && (this.ui.elements.orderNotes.value = '');

    // Resetear cantidades
    this.products.productCards.forEach(card => {
      card.qtyElement.textContent = '0';
    });

    this.ui.updateOrderSummary(this.currentOrder);
    this.clearLocalStorage();
  }

  showStats() {
    // Implementación básica - puedes expandir esto
    const totalOrders = this.orderCounter;
    const totalRevenue = this.currentOrder.total; // Esto debería venir de historial

    this.ui.showAlert(
      `Estadísticas:\n\n` +
      `Total de pedidos: ${totalOrders}\n` +
      `Ingresos totales: $${totalRevenue.toFixed(2)}`
    );
  }

  saveToLocalStorage() {
    const data = {
      currentOrder: this.currentOrder,
      specialOrder: this.specialOrderHandler.getData(),
      productStates: this.products.getStates()
    };
    this.storage.save(data);
  }

  quickSave() {
    const minimalData = {
      items: this.currentOrder.items,
      client: this.currentOrder.client,
      specialItems: this.specialOrderHandler.items,
      productStates: this.products.getStates()
    };
    this.storage.quickSave(minimalData);
  }

  loadFromLocalStorage() {
    const savedData = this.storage.load();
    if (!savedData) return;

    // Restaurar datos principales
    this.currentOrder = savedData.currentOrder || this.createEmptyOrder();

    // Restaurar pedido especial
    this.specialOrderHandler.setData(savedData.specialOrder || {});

    // Restaurar estados de productos
    this.products.restoreStates(savedData.productStates || {});

    // Actualizar UI
    this.ui.updateOrderSummary(this.currentOrder);
    this.specialOrderHandler.updateUI();
    this.ui.restoreFormFields(this.currentOrder.client, this.currentOrder.notes);
  }

  clearLocalStorage() {
    this.storage.clear();
  }

  // Método para prevenir memory leaks
  destroy() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Limpiar event listeners
    document.removeEventListener('click', this.handleDocumentClick);

    // Limpiar referencias
    this.products.productCards.clear();
    this.products.productCache.clear();
  }

  addSpecialToCart(specialItem) {
    // Agregar al carrito principal
    this.currentOrder.items.push(specialItem);

    // Actualizar el total
    this.currentOrder.total += specialItem.price;

    // Actualizar la UI y guardar
    this.ui.updateOrderSummary(this.currentOrder);
    this.saveToLocalStorage();

    this.ui.showAlert('Pedido especial agregado al carrito principal');
  }
}