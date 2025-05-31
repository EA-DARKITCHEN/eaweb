import { escapeHtml } from './utils.js';

export class SpecialOrderHandler {
  constructor(orderManager) {
    this.orderManager = orderManager;
    this.items = [];
    this.total = 0;
    this.specialQty = 0;

    this.initElements();
  }

  initElements() {
    this.elements = {
      sauceSelect: document.getElementById('sauce-select'),
      specialQtyDisplay: document.querySelector('#especiales .qty'),
      specialItemsList: document.getElementById('special-items-list'),
      specialOrderTotal: document.getElementById('special-order-total'),
      addSpecialItemBtn: document.getElementById('add-special-item'),
      addToCartBtn: document.getElementById('add-to-cart')
    };

    this.setupEvents();
  }

  setupEvents() {
    // Botones de cantidad
    document.querySelectorAll('#especiales .qty-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-action');
        this.handleQtyChange(action);
      });
    });

    // Botones especiales
    if (this.elements.addSpecialItemBtn) {
      this.elements.addSpecialItemBtn.addEventListener('click', () => this.addItem());
    }

    if (this.elements.addToCartBtn) {
      this.elements.addToCartBtn.addEventListener('click', () => this.addToMainOrder());
    }
  }

  handleQtyChange(action) {
    if (action === 'increase') {
      this.specialQty++;
    } else if (action === 'decrease' && this.specialQty > 0) {
      this.specialQty--;
    }

    if (this.elements.specialQtyDisplay) {
      this.elements.specialQtyDisplay.textContent = this.specialQty;
    }
  }

  addItem() {
    if (!this.elements.sauceSelect) return;

    const sauce = this.elements.sauceSelect.value;
    const quantity = this.specialQty;

    if (!sauce || quantity <= 0) {
      this.orderManager.ui.showAlert('Selecciona una salsa y cantidad válida');
      return;
    }

    const sauceName = this.elements.sauceSelect.options[
      this.elements.sauceSelect.selectedIndex
    ].text;
    const pricePerUnit = this.calculatePrice(sauce);
    const totalPrice = pricePerUnit * quantity;

    this.items.push({
      id: Date.now(),
      sauce,
      sauceName,
      quantity,
      pricePerUnit,
      totalPrice
    });

    this.total += totalPrice;
    this.specialQty = 0;

    this.updateUI();
  }

  calculatePrice(sauce) {
    // Lógica de precios según la salsa
    return 17; // Precio base
  }

  updateUI() {
    if (!this.elements.specialItemsList || !this.elements.specialOrderTotal) return;

    this.elements.specialItemsList.innerHTML = this.items
      .map(item => this.createItemHTML(item))
      .join('');

    this.elements.specialOrderTotal.textContent = `$${this.total.toFixed(2)}`;

    if (this.elements.specialQtyDisplay) {
      this.elements.specialQtyDisplay.textContent = '0';
    }

    if (this.elements.addToCartBtn) {
      this.elements.addToCartBtn.disabled = this.items.length === 0;
    }
  }

  createItemHTML(item) {
    return `
      <div class="special-item">
        <div class="item-info">
          <span>${item.quantity} alitas ${escapeHtml(item.sauceName)}</span>
          <span>$${item.pricePerUnit.toFixed(2)} c/u</span>
        </div>
        <span>$${item.totalPrice.toFixed(2)}</span>
        <button class="remove-item" data-id="${item.id}" type="button">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
  }


  addToMainOrder() {
    if (this.items.length === 0) return;

    const description = "Pedido Especial: " +
      this.items.map(item => `${item.quantity} ${item.sauceName}`).join(', ');

    // Cambia esta parte:
    this.orderManager.addSpecialToCart({
      id: `special-${Date.now()}`,
      name: description,
      price: this.total,
      quantity: 1,
      isSpecial: true
    });

    this.reset();
  }

  reset() {
    this.items = [];
    this.total = 0;
    this.specialQty = 0;
    this.updateUI();
  }

  getData() {
    return {
      items: this.items,
      total: this.total,
      specialQty: this.specialQty
    };
  }

  setData(data) {
    this.items = data.items || [];
    this.total = data.total || 0;
    this.specialQty = data.specialQty || 0;
  }
}