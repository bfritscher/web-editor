export const OPTIONS = 'options';
export const CATALOG = 'catalog';
export const LAST = 'last';

export function save(key, object) {
  localStorage.setItem(key, JSON.stringify(object));
}

export function load(key, defaultValue) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch (e) {
    return defaultValue || {};
  }
}
