
const getBalanceRet = { body: { username: 'userX', balance: '100000' } };
const validRetVal = { body: { status_code: 0, status: 'order sent', id: '2088374564' } };
const internalTransaction = { bitstampOrderId: '2092218561', size: '7358.93', price: '0.06286195', type: 'buy', requestId: '1111111' };

export class BitstampWrapperMock {
  balance() {
    return getBalanceRet;
  }
  buyLimitOrder(size, price, currency, limitPrice, dailyOrder, iocOrder) {
    return validRetVal;
  }

  sellLimitOrder(size, price, currency, limitPrice, dailyOrder, iocOrder) {
    return validRetVal;
  }

  openOrdersAll(params = null) {

  }

  orderStatus(orderId) {

  }
}

export class BitstampOrderTracerMock {
  addNewTransaction(params) {
    // console.log('transaction');

  }
}

export class TickerStreamMock {
  subscribe() {
    // console.log('subscribe');
  }

  on(subject, func) {
  }
}

export class FutureMock {
  then(x) {
    return x({ body: { btc_available:'100', usd_available:'100' } });
  }
}


