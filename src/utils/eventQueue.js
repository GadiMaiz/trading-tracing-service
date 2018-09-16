let kafka = require('kafka-node');
import logger from 'logger';


class EventQueue {
    constructor(orderExecuter) {
        this.client = new kafka.Client('localhost:2181');
        this.topics = [{ topic: 'orders', partition: 0 }];
        this.options = { autoCommit: true, fetchMaxWaitMs: 1000, fetchMaxBytes: 1024 * 1024 };
        this.consumer = new kafka.Consumer(this.client, this.topics, this.options);
        this.offset = new kafka.Offset(this.client);

        this.consumer.on('message', function (message) {
            orderExecuter.execute(message);
        });

        this.consumer.on('error', function (err) {
            logger.err('Kafka expericanced an error - ' + err);
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

    eventOrderSuccess(order) {
        console.log(order);
    }

    eventOrderFailed(order) {
        console.log(order);
    }
}


export default EventQueue;