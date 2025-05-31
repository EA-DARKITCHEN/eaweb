import { initTheme } from './modules/theme.js';
import { OrderManager } from './modules/orderManager.js';

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  try {
    // Inicializar tema
    initTheme();
    
    // Inicializar OrderManager
    const orderManager = new OrderManager();
    
    // Manejar evento beforeunload para guardar datos
    window.addEventListener('beforeunload', () => {
      orderManager.quickSave();
    });
    
    // Hacer disponible globalmente si es necesario
    window.orderManager = orderManager;
    
  } catch (error) {
    console.error('Error al inicializar la aplicación:', error);
    alert('Error al cargar la aplicación. Revise la consola para más detalles.');
  }
});