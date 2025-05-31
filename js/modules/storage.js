export class StorageHandler {
  constructor(storageKey) {
    this.storageKey = storageKey;
    this.quickSaveKey = `${storageKey}_quick`;
  }
  
  save(data) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error al guardar datos:', error);
      return false;
    }
  }
  
  load() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error al cargar datos:', error);
      return null;
    }
  }
  
  clear() {
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.quickSaveKey);
  }
  
  quickSave(data) {
    try {
      const minimalData = {
        items: data.currentOrder.items,
        client: data.currentOrder.client,
        specialItems: data.specialOrder.items,
        productStates: data.productStates
      };
      localStorage.setItem(this.quickSaveKey, JSON.stringify(minimalData));
    } catch (error) {
      console.error('Error en quickSave:', error);
    }
  }
  
  loadQuickSave() {
    try {
      const data = localStorage.getItem(this.quickSaveKey);
      if (data) {
        localStorage.removeItem(this.quickSaveKey);
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      console.error('Error al cargar quickSave:', error);
      return null;
    }
  }
}