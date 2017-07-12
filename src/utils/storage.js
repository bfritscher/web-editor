export const OPTIONS = 'options';
export const CATALOG = 'catalog';
export const LAST = 'last';

export function save(key, object) {
  localStorage.setItem(key, JSON.stringify(object));
}

export function load(key, defaultValue) {
  try {
    const object = JSON.parse(localStorage.getItem(key));
    if (!object) {
      return defaultValue || {};
    }
    return object;
  } catch (e) {
    return defaultValue || {};
  }
}

export const catalog = load(CATALOG);

export function updateCatalog(id, title) {
  catalog[id] = {
    id,
    title,
    lastSaved: new Date().toISOString()
  };
  save(CATALOG, catalog);
}

export function deleteFromCatalog(id) {
  delete catalog[id];
  save(CATALOG, catalog);
  localStorage.removeItem(id);
}
