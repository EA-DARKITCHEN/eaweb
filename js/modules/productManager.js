import { escapeHtml } from './utils.js';

export class ProductManager {
  constructor() {
    this.products = this.getProductList();
    this.productCache = this.createProductCache();
    this.productCards = new Map();
  }
  
  getProductList() {
    return {
      alitas: [
        { id: 1, name: "Alitas Mango Habanero", price: 85 },
        { id: 2, name: "Alitas BBQ", price: 85 },
        { id: 3, name: "Alitas Salsa Brava", price: 85 },
        { id: 4, name: "Alitas Queso Parmesano", price: 85 },
        { id: 5, name: "Alitas Estilo Brayan", price: 85 },
        { id: 6, name: "Aderezo Rancha Ext.", price: 10}
      ],
      boneless: [
        { id: 7, name: "Boneless Mango Habanero", price: 75 },
        { id: 8, name: "Boneless BBQ", price: 75 },
        { id: 9, name: "Boneless Salsa Brava", price: 75 },
        { id: 10, name: "Boneless Queso Parmesano", price: 75 }
      ],
      papas: [
        { id: 11, name: "Papas Delgadas", price: 35 },
        { id: 12, name: "Papas Onduladas", price: 35 },
        { id: 13, name: "Papas con Queso", price: 45 }
      ],
      bebidas: [
        { id: 14, name: "Frappe Moka", price: 40 },
        { id: 15, name: "Frappe Oreo", price: 40 },
        { id: 16, name: "Frappe Fresa", price: 40 },
        { id: 17, name: "Refresco 600ml", price: 25 },
        { id: 18, name: "Agua Mineral", price: 20 }
      ]
    };
  }
  
  createProductCache() {
    const cache = new Map();
    Object.values(this.products).flat().forEach(product => {
      cache.set(product.id.toString(), product);
    });
    return cache;
  }
  
  renderAll() {
    for (const [category, items] of Object.entries(this.products)) {
      const container = document.getElementById(category);
      if (!container) continue;
      
      container.innerHTML = items.map(product => this.createProductCard(product)).join('');
      
      // Cache de elementos del DOM
      container.querySelectorAll('.product-card').forEach(card => {
        const qtyElement = card.querySelector('.qty');
        if (qtyElement) {
          this.productCards.set(card.dataset.id, { element: card, qtyElement });
        }
      });
    }
  }
  
  createProductCard(product) {
    return `
      <div class="product-card" data-id="${product.id}">
        <div class="product-info">
          <h3>${escapeHtml(product.name)}</h3>
          <span class="price">$${product.price}</span>
        </div>
        <div class="product-controls">
          <button class="qty-btn minus" data-action="minus" type="button">-</button>
          <span class="qty">0</span>
          <button class="qty-btn plus" data-action="plus" type="button">+</button>
        </div>
      </div>
    `;
  }
  
  getStates() {
    const states = {};
    this.productCards.forEach((value, key) => {
      states[key] = value.qtyElement.textContent;
    });
    return states;
  }
  
  restoreStates(states) {
    Object.entries(states).forEach(([id, qty]) => {
      const card = this.productCards.get(id);
      if (card) {
        card.qtyElement.textContent = qty;
      }
    });
  }
}
