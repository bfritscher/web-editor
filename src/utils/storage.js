export default {
  OPTIONS: 'options',
  CATALOG: 'catalog',
  save(key, object) {
    localStorage.setItem(key, JSON.stringify(object));
  },
  load(key, defaultValue) {
    try {
      return JSON.parse(localStorage.getItem(key));
    } catch (e) {
      return defaultValue || {};
    }
  }
};
