

class ClientEventQueue {
    constructor() {
        this.dummy = 'dummy';
    }

    setEventOrderSuccess(order) {
        console.log(order);
    }

    setEventOrderFailed(order) {
        console.log(order);
    }

}

let clientEventQueue = new ClientEventQueue();

module.exports = clientEventQueue;