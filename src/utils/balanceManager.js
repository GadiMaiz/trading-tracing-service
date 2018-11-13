import logger from 'logger';

class BalanceManager {
  constructor(currencyDictionary) {
    this.currencyDictionary = currencyDictionary;

    this.balances = {};
  }

  getAllBalance() {
    return this.balances;
  }

  getBalance(currencyList, userId) {
    if (!this.balances[userId]) {
      return {};
    }

    return currencyList.map((item) => { return (this.balances[userId][item]) ? this.balances[userId][item] : 0; });
  }

  async updateAllBalance(balancesList, userId) {
    if (!this.balances[userId]) {
      this.balances[userId] = {};
    }
    Object.keys(balancesList).forEach((key) => {
      try {
        const newKey = this.currencyDictionary[key];
        if (newKey) {
          this.balances[userId][newKey] = Number(balancesList[key]);
        }
      }
      catch (error) {
        console.log('error = ' + error);
      }
    });
  }

  addToBalance(currency, size, userId) {
    this.balances[userId][currency] = this.balances[userId][currency] + Number(size);
    this.balances[userId][currency + '_ALL'] = this.balances[userId][currency + '_ALL'] + Number(size);
  }

  subtractFromBalance(currency, size, userId) {
    this.balances[userId][currency] = this.balances[userId][currency] - Number(size);
    this.balances[userId][currency + '_ALL'] = this.balances[userId][currency + '_ALL'] - Number(size);
  }


}

export default BalanceManager;