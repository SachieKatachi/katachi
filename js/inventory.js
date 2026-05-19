/**
 * INVENTORY MODULE
 * Track raw materials, ingredients, suppliers
 * Full EN/JA support
 */

const Inventory = (() => {
  const STORAGE_KEY = 'k_inventory';
  let items = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

  function generateId() {
    return 'inv_' + Date.now();
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  function addItem(data) {
    const item = {
      id: generateId(),
      name: data.name || '',
      quantity: parseFloat(data.quantity) || 0,
      unit: data.unit || '',
      minQuantity: parseFloat(data.minQuantity) || 0,
      supplier: data.supplier || '',
      cost: parseFloat(data.cost) || 0,
      category: data.category || 'General',
      lastRestocked: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    items.push(item);
    save();
    if (window.Logger) {
      window.Logger.info('Inventory item added', { name: item.name });
    }
    return item;
  }

  function getAll() {
    return items;
  }

  function getById(id) {
    return items.find(i => i.id === id);
  }

  function update(id, data) {
    const item = getById(id);
    if (!item) return null;
    Object.assign(item, data);
    save();
    return item;
  }

  function delete_(id) {
    items = items.filter(i => i.id !== id);
    save();
  }

  function updateQuantity(id, newQuantity) {
    const item = getById(id);
    if (!item) return null;
    item.quantity = parseFloat(newQuantity);
    item.lastRestocked = new Date().toISOString();
    save();
    return item;
  }

  function getLowStock() {
    return items.filter(i => i.quantity <= i.minQuantity);
  }

  function getOutOfStock() {
    return items.filter(i => i.quantity === 0);
  }

  function search(query) {
    const q = query.toLowerCase();
    return items.filter(i =>
      i.name.toLowerCase().includes(q) ||
      i.supplier.toLowerCase().includes(q) ||
      i.category.toLowerCase().includes(q)
    );
  }

  function getTotalValue() {
    return items.reduce((sum, item) => sum + (item.quantity * item.cost), 0);
  }

  function getByCategory(category) {
    return items.filter(i => i.category === category);
  }

  if (window.Logger) {
    window.Logger.info('Inventory module loaded', { count: items.length });
  }

  return {
    addItem,
    getAll,
    getById,
    update,
    delete: delete_,
    updateQuantity,
    getLowStock,
    getOutOfStock,
    search,
    getTotalValue,
    getByCategory
  };
})();

window.Inventory = Inventory;
console.log('[Inventory] Inventory module loaded');
