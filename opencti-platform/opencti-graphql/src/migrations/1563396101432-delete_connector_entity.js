import { executeWrite } from '../database/grakn';
import { logger } from '../config/conf';

module.exports.up = async next => {
  try {
    await executeWrite(async wTx => {
      await wTx.tx.query('match $x isa Connector; delete $x;');
      await wTx.tx.query('undefine Connector sub entity;');
      await wTx.tx.query('match $x isa connector_identifier; delete $x;');
      await wTx.tx.query('undefine connector_identifier sub attribute;');
      await wTx.tx.query('match $x isa connector_config; delete $x;');
      await wTx.tx.query('undefine connector_config sub attribute;');
    });
  } catch (err) {
    logger.info('[MIGRATION] Skipped delete Connector entity');
  }
  next();
};

module.exports.down = async next => {
  next();
};
