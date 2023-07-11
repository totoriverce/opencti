import { executionContext, SYSTEM_USER } from '../utils/access';
import { addVocabulary } from '../modules/vocabulary/vocabulary-domain';
import { VocabularyCategory } from '../generated/graphql';
import { builtInOv, openVocabularies } from '../modules/vocabulary/vocabulary-utils';
import { logApp } from '../config/conf';

const message = '[MIGRATION] Adding reliability open vocabulary';

export const up = async (next) => {
  const context = executionContext('migration');
  logApp.info(`${message} > started`);
  const category = VocabularyCategory.ReliabilityOv;
  const vocabularies = openVocabularies[category] ?? [];
  for (let i = 0; i < vocabularies.length; i += 1) {
    const { key, description, order } = vocabularies[i];
    const data = { name: key, description, category, order, builtIn: builtInOv.includes(category) };
    await addVocabulary(context, SYSTEM_USER, data);
  }
  logApp.info(`${message} > done. ${vocabularies.length} vocabularies added.`);
  next();
};

export const down = async (next) => {
  next();
};
