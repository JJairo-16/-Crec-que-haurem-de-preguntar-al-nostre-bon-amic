/**
 * Crea un sistema d'emmagatzematge en memòria.
 * 
 * Utilitza un Map intern per guardar dades durant l'execució.
 * No persisteix entre recàrregues de la pàgina.
 * 
 * @returns {Object} API d'emmagatzematge amb mètodes get, set i remove
 */
export function createMemoryStorage() {
  const store = new Map();

  return {
    /**
     * Obté un valor a partir de la clau
     * @param {string} key - Clau de l'element
     * @returns {*} valor associat o null si no existeix
     */
    get(key) {
      return store.has(key) ? store.get(key) : null;
    },

    /**
     * Desa un valor associat a una clau
     * Es fa una còpia profunda per evitar mutacions externes
     * 
     * @param {string} key - Clau de l'element
     * @param {*} value - Valor a guardar
     */
    set(key, value) {
      store.set(key, structuredClone(value));
    },

    /**
     * Elimina un valor a partir de la clau
     * @param {string} key - Clau de l'element
     */
    remove(key) {
      store.delete(key);
    }
  };
}

/**
 * Crea un adaptador per utilitzar sessionStorage
 * amb una interfície compatible amb createMemoryStorage
 * 
 * @param {Storage} sessionStorage - Objecte sessionStorage del navegador
 * @returns {Object} API d'emmagatzematge amb mètodes get, set i remove
 */
export function createSessionStorageAdapter(sessionStorage) {
  return {
    /**
     * Obté un valor des de sessionStorage
     * 
     * @param {string} key - Clau de l'element
     * @returns {*} Objecte parsejat o null si no existeix o hi ha error
     */
    get(key) {
      const raw = sessionStorage.getItem(key);

      if (!raw) {
        return null;
      }

      try {
        return JSON.parse(raw);
      } catch {
        // Si el JSON està corrupte, s'elimina per evitar errors futurs
        sessionStorage.removeItem(key);
        return null;
      }
    },

    /**
     * Desa un valor a sessionStorage en format JSON
     * 
     * @param {string} key - Clau de l'element
     * @param {*} value - Valor a guardar
     */
    set(key, value) {
      sessionStorage.setItem(key, JSON.stringify(value));
    },

    /**
     * Elimina un element de sessionStorage
     * 
     * @param {string} key - Clau de l'element
     */
    remove(key) {
      sessionStorage.removeItem(key);
    }
  };
}