/**
 * Crea un sistema d'emmagatzematge en memòria.
 *
 * Utilitza un Map intern per guardar dades durant l'execució.
 * No persisteix entre recàrregues de la pàgina.
 *
 * @returns {{
 *   get: (key: string) => any,
 *   set: (key: string, value: any) => void,
 *   remove: (key: string) => void
 * }}
 */
export function createMemoryStorage() {
  const store = new Map();

  return {
    /**
     * Obté un valor a partir d'una clau.
     *
     * @param {string} key - Clau de l'element
     * @returns {any|null} Valor associat o `null` si no existeix
     */
    get(key) {
      return store.has(key) ? store.get(key) : null;
    },

    /**
     * Desa un valor associat a una clau.
     *
     * @param {string} key - Clau de l'element
     * @param {any} value - Valor a guardar
     * @returns {void}
     */
    set(key, value) {
      store.set(key, structuredClone(value));
    },

    /**
     * Elimina un valor a partir d'una clau.
     *
     * @param {string} key - Clau de l'element
     * @returns {void}
     */
    remove(key) {
      store.delete(key);
    }
  };
}

/**
 * Crea un adaptador per utilitzar sessionStorage
 * amb una interfície compatible amb createMemoryStorage.
 *
 * @param {Storage} sessionStorage - Objecte sessionStorage del navegador
 * @returns {{
 *   get: (key: string) => any,
 *   set: (key: string, value: any) => void,
 *   remove: (key: string) => void
 * }}
 */
export function createSessionStorageAdapter(sessionStorage) {
  return {
    /**
     * Obté un valor des de sessionStorage.
     *
     * @param {string} key - Clau de l'element
     * @returns {any|null} Objecte parsejat o `null` si no existeix o hi ha error
     */
    get(key) {
      const raw = sessionStorage.getItem(key);

      if (!raw) {
        return null;
      }

      try {
        return JSON.parse(raw);
      } catch {
        sessionStorage.removeItem(key);
        return null;
      }
    },

    /**
     * Desa un valor a sessionStorage en format JSON.
     *
     * @param {string} key - Clau de l'element
     * @param {any} value - Valor a guardar
     * @returns {void}
     */
    set(key, value) {
      sessionStorage.setItem(key, JSON.stringify(value));
    },

    /**
     * Elimina un element de sessionStorage.
     *
     * @param {string} key - Clau de l'element
     * @returns {void}
     */
    remove(key) {
      sessionStorage.removeItem(key);
    }
  };
}