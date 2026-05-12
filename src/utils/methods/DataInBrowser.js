/**
 * Util functions to set and get data from localStorage
 * Example of use:
 *
 * setDataInBrowser("user_email", "bobthegreat@gmail.com"); // set "user_email" in localStorage
 * var userEmail = getDataInBrowser("user_email"); // "bobthegreat@gmail.com"
 */

export const setDataInBrowser = (name, value) => {
  localStorage.setItem(name, JSON.stringify(value));
};

export const getDataInBrowser = name => {
  try {
    return JSON.parse(localStorage.getItem(name));
  } catch (error) {
    return null;
  }
};

export const removeDataInBrowser = name => {
  localStorage.removeItem(name);
};