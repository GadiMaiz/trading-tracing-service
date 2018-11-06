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
    // let ans = [];
    // for (let iterator in currencyList) {
    //   try {
    //     // ans.push(this.balances[currencyList[iterator]]);
    //     ans[currencyList[iterator]] = this.balances[currencyList[iterator]];
    //   }
    //   catch (error) {
    //     ans[currencyList[iterator]] = 0;
    //     logger.error('error getting balance :  %s', error);
    //   }
    // }
    // return ans;
    return currencyList.map((item) => { (this.balances[item]) ? this.balances[item] : 0; });
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