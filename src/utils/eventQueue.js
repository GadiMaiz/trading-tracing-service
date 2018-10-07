let kafka = require('kafka-node');
import logger from 'logger';
import { Status, returnMessages } from 'status';
import moment from 'moment';


// configurations:
let ORDERS_TOPIC = 'orders';
let NOTIFICATION_TOPIC = 'notifications';
let PARTITION = 0;
let PORT = '2181';
let URL = 'localhost';

let KeyedMessage = kafka.KeyedMessage;
class EventQueue {
  constructor(orderExecuter) {
    // ////// notifications producer initilization

    this.client = new kafka.Client( URL + ':' + PORT);
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
        let min = Math.min.apply(null, offsets[topic.topic][topic.partition]);
        this.consumer.setOffset(topic.topic, topic.partition, min);
      });
    });
  }

  sendNotification(notificationType, parameters) {
    parameters['eventTimeStamp'] = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
    let keyedMessage = new KeyedMessage(notificationType, JSON.stringify(parameters));

    this.notificationProducer.send([{ topic: NOTIFICATION_TOPIC,  partition: PARTITION, messages: [keyedMessage] }], function (err, result) {
      if (err) {
        logger.error(err);
      }
      else {
        logger.info(JSON.stringify(result));
      }
    });
  }

  eventOrderSuccess(order) {
    console.log(order);
  }

  eventOrderFailed(order) {
    console.log(order);
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