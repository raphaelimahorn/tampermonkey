/**
 * loads a value from storage or asks the user to insert one (which will then be persisted)
 * @param {string} id the identifier for the value in localStorage
 * @param {string} description what should the user be asked, what to name
 * @param {string} defaultValue the default value
 * @returns {string | null} either the value or undefined, if the user cancels
 */
function loadOrInsertFromStorage(id, description, defaultValue = '') {
    const persistedValue =  localStorage.getItem(id);
    if (!!persistedValue) return persistedValue;
    
    const userInput = prompt(description, defaultValue);
    if (!!userInput) localStorage.setItem(id, userInput);
    
    return userInput;
}