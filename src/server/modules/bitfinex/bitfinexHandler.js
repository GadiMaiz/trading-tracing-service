import BFX from 'bitfinex-api-node';
import { returnMessages, Status } from 'status';
import logger from 'logger';



class BitfinexHandler {
  constructor(params, bitfinexWrapper, bitfinexOrderTracer) {
    if (!bitfinexWrapper && !bitfinexOrderTracer) {
      this.bitfinexWrapper = new BFX({
        apiKey: params.key,
        apiSecret: params.secret,
        ws: {
          autoReconnect: true,
          seqAudit: true,
          packetWDDelay: 10 * 1000
        }
      });
    }
    else if (bitfinexWrapper && bitfinexOrderTracer) {
      this.bitfinexWrapper = bitfinexWrapper;
      this.bitfinexOrderTracer = bitfinexOrderTracer;
    }
    else {
      throw new Error('could not construct bitfinexHandler, input parameters are not valid');
    }

  }

  async getUserAccountData() {
    logger.debug('about to send get user data request to bitfinex');
    let rest = this.bitfinexWrapper.rest(2);
    return await rest.balances();
  }

  /**
     * if it is possible to buy the whole amount of coins at the requested price or cheaper the transaction will happened
     * if not the request will fail
     * @param {object} params
     * @param {string} params.amount - (double as string) how many coins should be sold
     * @param {string} params.price -  (double as string) the price per single coin
     * @param {string} params.currency - the pair to exchange, if doesn't exist BTC_USD pair will be chosen
     */
  async buyImmediateOrCancel(params) {
    // const currency = (!params.currency) ? BTC_USD : params.currency;
    // logger.debug('sending buy immediate or cancel order request');
    // return await this.sendOrder('buy', { amount: params.amount, price: params.price, currency: currency, limitPrice: params.limitPrice, dailyOrder: null, iocOrder: true });
  }

}


let bitfinexHandler;

/**
 * this is an implemintation of singletone
 * if the object already exist returnes the instance else creates the object and retunes the instance
 * @param {object} parameters -  being dligated to the bitfinexHandler constructor
 */
const getInstance = (parameters) => {
  if (!bitfinexHandler) {
    if (!parameters) {
      throw { status: returnMessages.NotLoggedIn, message: returnMessages.NotLoggedIn };
    }
    bitfinexHandler = new BitfinexHandler(parameters);
  }
  return bitfinexHandler;
};

module.exports = getInstance;
module.exports.BitfinexHandler = BitfinexHandler;