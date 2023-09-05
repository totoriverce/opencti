/* eslint-disable */
// noinspection ES6UnusedImports,ES6CheckImport

import fs, {mkdir} from 'node:fs';
import {printSchema} from 'graphql/utilities';
import createSchema from '../src/graphql/schema';
import _ from '../src/modules/index';

console.log('[script-generate-schema]: starting generation...');

const schema = createSchema();
const printedSchema = printSchema(schema);

try {
  fs.mkdirSync('../opencti-front/src/schema/', {recursive: true});
} catch (error) {
  if (!(error.message.startsWith("EEXIST"))) {
    throw error;
  }
}

fs.writeFileSync('../opencti-front/src/schema/relay.schema.graphql', printedSchema);

console.log('[script-generate-schema]: generation done')