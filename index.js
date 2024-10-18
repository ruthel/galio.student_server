const { ServiceBroker } = require('moleculer');
const config = require('./moleculer.config');

config.hotReload = true;

const broker = new ServiceBroker(config);

broker.logger.info(`NODE_ENV: ${process.env.NODE_ENV}`);
if (process.env.NODE_ENV === 'dev') {
  broker.repl();
}

broker.loadServices('services', '**/*.service.js');
broker.start();
