import logger from 'logger';

class BalanceManager {
  constructor(currencyDictionary) {
    this.currencyDictionary = currencyDictionary;

    this.balances = {};
    this.isInitialized = false;
  }

  getAllBalance() {
    return this.balances;
  }

  getBalance(currencyList) {
    let ans = [];
    for (let iterator in currencyList) {
      try {
        ans.push(this.balances[currencyList[iterator]]);
      }
      catch (error) {
        logger.error('error getting balance :  ' + error);
      }
    }
    return ans;
  }

  updateAllBalance(balancesList) {
    Object.keys(balancesList).forEach((key) => {
      try {
        let newKey = this.currencyDictionary[key];
        this.balances[newKey] = Number(balancesList[key]);
      }
      catch (error) {
        // console.log('x');
      }
    });
  }

  addToBalance(currency, amount) {
    this.balances[currency] = this.balances[currency] + Number(amount);
  }

  subtractFromBalance(currency, amount) {
    this.balances[currency] = this.balances[currency] - Number(amount);
  }
}

export default BalanceManager;