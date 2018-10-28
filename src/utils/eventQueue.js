const kafka = require('kafka-node');
import logger from 'logger';
import { Status, returnMessages } from 'status';
import moment from 'moment';
import { Module } from 'moduleInfo';


// configurations:
const ORDERS_TOPIC = 'orders';
const NOTIFICATION_TOPIC = 'notifications';
const BALANCES_TOPIC = 'balances';
const TRADES_TOPIC = 'trades';
const PARTITION = 0;
const PORT = '2181';
const URL = 'localhost';


let KeyedMessage = kafka.KeyedMessage;
class EventQueue {
  constructor(orderExecuter) {
    // ////// notifications producer initialization

    this.client = new kafka.Client(URL + ':' + PORT);
    this.client2 = new kafka.Client(URL + ':' + PORT);
    this.notificationProducer = new kafka.Producer(this.client);

    this.notificationProducer.on('ready', function () {
      this.client.refreshMetadata([NOTIFICATION_TOPIC], (err) => {
        if (err) {
          console.warn('Error refreshing kafka metadata', err);
        }
      });
    });

    this.notificationProducer.on('error', function (err) {
      console.log('error', err);
    });


    this.tradesProducer = new kafka.Producer(this.client);


    this.tradesProducer.on('ready', function () {
      this.client.refreshMetadata([TRADES_TOPIC], (err) => {
        if (err) {
          console.warn('Error refreshing kafka metadata', err);
        }
      });
    });

    this.tradesProducer.on('error', function (err) {
      console.log('error', err);
    });

    this.balanceProducer = new kafka.Producer(this.client2);

    this.balanceProducer.on('ready', function () {
      this.client.refreshMetadata([BALANCES_TOPIC], (err) => {
        if (err) {
          console.warn('Error refreshing kafka metadata', err);
        }
      });
    });

    this.balanceProducer.on('error', function (err) {
      console.log('error', err);
    });


    // order requests consumer initilization

    this.topics = [{ topic: ORDERS_TOPIC, partition: 0 }];
    this.options = { autoCommit: true, fetchMaxWaitMs: 1000, fetchMaxBytes: 1024 * 1024 };
    this.consumer = new kafka.Consumer(this.client, this.topics, this.options);
    this.offset = new kafka.Offset(this.client);

    this.consumer.on('message', function (message) {
      orderExecuter.execute(message);
    });

    this.consumer.on('error', function (err) {
      logger.error('Kafka experienced an error - ' + err);
    });

    this.consumer.on('offsetOutOfRange', function (topic) {
      topic.maxNum = 2;
      this.offset.fetch([topic], function (err, offsets) {
        if (err) {
          return console.error(err);
        }
        const min = Math.min.apply(null, offsets[topic.topic][topic.partition]);
        this.consumer.setOffset(topic.topic, topic.partition, min);
      });
    });
  }

  sendNotification(notificationType, parameters) {
    parameters['eventTimeStamp'] = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
    parameters['sendingModule'] = Module.name;
    const keyedMessage = new KeyedMessage(notificationType, JSON.stringify(parameters));
    this.notificationProducer.send([{ topic: NOTIFICATION_TOPIC, partition: PARTITION, messages: [keyedMessage] }], function (err, result) {
      if (err) {
        logger.error(err);
      }
      else {
        logger.info(JSON.stringify(result));
      }
    });
  }

  sendBalance(exchange, parameters) {
    const keyedMessage = new KeyedMessage(exchange, JSON.stringify(parameters));
    this.balanceProducer.send([{ topic:BALANCES_TOPIC, partition: PARTITION, messages: [keyedMessage] }], function (err, result) {
      if (err) {
        logger.error(err);
      }
      else {
        logger.info(JSON.stringify(result));
      }
    });
  }

  sendTrade(exchange, parameters) {
    const keyedMessage = new KeyedMessage(exchange, JSON.stringify(parameters));
    this.tradesProducer.send([{ topic:TRADES_TOPIC, partition: PARTITION, messages: [keyedMessage] }], function (err, result) {
      if (err) {
        logger.error(err);
      }
      else {
        logger.info(JSON.stringify(result));
      }
    });
  }
}

let eventQueue;

const getInstance = (orderExecuter) => {
  if (!eventQueue) {
    if (!orderExecuter) {
      throw { status: Status.Error, message: returnMessages.EventQueueInitFailed };
    }
    eventQueue = new EventQueue(orderExecuter);
  }
  return eventQueue;
};

module.exports = getInstance;