import logger from 'logger';

class BalanceManager {
  constructor(currencyDictionary) {
    this.currencyDictionary = currencyDictionary;

    this.balances = {};
  }

  getAllBalance() {
    return this.balances;
  }

  getBalance(currencyList) {
    return currencyList.map((item) => { return (this.balances[item]) ? this.balances[item] : 0; });
  }

  updateAllBalance(balancesList) {
    Object.keys(balancesList).forEach((key) => {
      try {
        const newKey = this.currencyDictionary[key];
        
        if (newKey) {
          this.balances[newKey] = Number(balancesList[key]);
        }
      }
      catch (error) {
        console.log('error = ' + error);
      }
    });
  }

  addToBalance(currency, amount) {
    this.balances[currency] = this.balances[currency] + Number(amount);
    this.balances[currency + '_ALL'] = this.balances[currency + '_ALL'] + Number(amount);
  }

  subtractFromBalance(currency, amount) {
    this.balances[currency] = this.balances[currency] - Number(amount);
    this.balances[currency + '_ALL'] = this.balances[currency + '_ALL'] - Number(amount);
  }


}

export default BalanceManager;