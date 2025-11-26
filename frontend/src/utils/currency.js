/**
 * Fonctions utilitaires pour la gestion de la monnaie HTG (Gourde Haïtienne)
 */

/**
 * Formate un montant en HTG avec le symbole approprié
 * @param {number} amount - Le montant à formater
 * @param {boolean} showSymbol - Afficher le symbole HTG ou non
 * @returns {string} - Le montant formaté
 */
export const formatHTG = (amount, showSymbol = true) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return showSymbol ? '0 HTG' : '0';
  }
  
  const formatted = Number(amount).toLocaleString('fr-HT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  return showSymbol ? `${formatted} HTG` : formatted;
};

/**
 * Formate un montant en HTG pour l'affichage dans les tableaux
 * @param {number} amount - Le montant à formater
 * @returns {string} - Le montant formaté avec HTG
 */
export const formatCurrency = (amount) => {
  return formatHTG(amount, true);
};

/**
 * Parse un string en nombre pour les calculs
 * @param {string|number} value - La valeur à parser
 * @returns {number} - Le nombre parsé
 */
export const parseAmount = (value) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    // Enlève les espaces, virgules et le symbole HTG
    const cleaned = value.replace(/[^\d.-]/g, '');
    return parseFloat(cleaned) || 0;
  }
  return 0;
};

/**
 * Convertit un montant USD en HTG (taux approximatif)
 * @param {number} usdAmount - Montant en USD
 * @param {number} exchangeRate - Taux de change (par défaut 110 HTG pour 1 USD)
 * @returns {number} - Montant en HTG
 */
export const convertUSDtoHTG = (usdAmount, exchangeRate = 110) => {
  return usdAmount * exchangeRate;
};

/**
 * Validation du format HTG
 * @param {string} value - La valeur à valider
 * @returns {boolean} - True si le format est valide
 */
export const isValidHTGAmount = (value) => {
  const htgPattern = /^\d+([.,]\d{1,2})?(\s?HTG)?$/;
  return htgPattern.test(value.toString().trim());
};

export default {
  formatHTG,
  formatCurrency,
  parseAmount,
  convertUSDtoHTG,
  isValidHTGAmount
};