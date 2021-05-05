const { computeMergeDifferential } = require('../../../src/database/redis');

// region data
const previous = {
  standard_id: 'threat-actor--71c2f3be-a4e9-556d-a0ef-d98e819d786e',
  i_created_at_day: '2021-05-03',
  internal_id: '6d57c1c1-ea4a-4897-9195-d05186af2917',
  spec_version: '2.1',
  parent_types: ['Basic-Object', 'Stix-Object', 'Stix-Core-Object', 'Stix-Domain-Object'],
  created: '2021-05-03T15:44:57.053Z',
  i_created_at_month: '2021-05',
  confidence: 15,
  description: 'DESC',
  created_at: '2021-05-03T15:44:57.053Z',
  revoked: false,
  i_created_at_year: '2021',
  entity_type: 'Threat-Actor',
  base_type: 'ENTITY',
  updated_at: '2021-05-03T15:44:57.053Z',
  name: 'THREAT_MERGE',
  modified: '2021-05-03T15:44:57.053Z',
  i_aliases_ids: ['aliases--6bcc2815-4164-5893-8204-8ec22a967528'],
  id: '6d57c1c1-ea4a-4897-9195-d05186af2917',
  x_opencti_stix_ids: [],
  goals: ['FIRST GOAL', 'MY GOAL'],
  lang: 'en',
  _index: 'opencti_stix_domain_objects-000001',
  objectLabel: [
    {
      standard_id: 'label--75615ade-1858-5c60-9ebd-9b63bc534dc5',
      i_created_at_day: '2021-04-29',
      color: '#d5cbb6',
      internal_id: '95a4c0d2-ee66-4f78-8722-07f93d23be54',
      spec_version: '2.1',
      parent_types: ['Basic-Object', 'Stix-Object', 'Stix-Meta-Object'],
      created: '2021-04-29T08:49:00.558Z',
      i_created_at_month: '2021-04',
      created_at: '2021-04-29T08:49:00.558Z',
      i_created_at_year: '2021',
      entity_type: 'Label',
      base_type: 'ENTITY',
      updated_at: '2021-04-29T08:49:00.558Z',
      modified: '2021-04-29T08:49:00.558Z',
      id: '95a4c0d2-ee66-4f78-8722-07f93d23be54',
      x_opencti_stix_ids: [],
      value: 'malware',
      _index: 'opencti_stix_meta_objects-000001',
    },
    {
      standard_id: 'label--355f76bb-be36-58dd-bdc9-90a75529df85',
      i_created_at_day: '2021-04-29',
      color: '#be70e8',
      internal_id: '4dd598ef-7466-4de8-930a-ef4362a73102',
      spec_version: '2.1',
      parent_types: ['Basic-Object', 'Stix-Object', 'Stix-Meta-Object'],
      created: '2021-04-29T08:48:59.270Z',
      i_created_at_month: '2021-04',
      created_at: '2021-04-29T08:48:59.270Z',
      i_created_at_year: '2021',
      entity_type: 'Label',
      base_type: 'ENTITY',
      updated_at: '2021-04-29T08:48:59.270Z',
      modified: '2021-04-29T08:48:59.270Z',
      id: '4dd598ef-7466-4de8-930a-ef4362a73102',
      x_opencti_stix_ids: [],
      value: 'identity',
      _index: 'opencti_stix_meta_objects-000001',
    },
  ],
  objectMarking: [
    {
      standard_id: 'marking-definition--907bb632-e3c2-52fa-b484-cf166a7d377c',
      x_opencti_color: '#ffffff',
      x_opencti_order: 0,
      i_created_at_day: '2021-04-29',
      internal_id: '329a8250-0beb-4f34-bf9e-5d3897ba43a6',
      spec_version: '2.1',
      parent_types: ['Basic-Object', 'Stix-Object', 'Stix-Meta-Object'],
      definition_type: 'TLP',
      created: '2020-02-25T09:02:29.040Z',
      i_created_at_month: '2021-04',
      created_at: '2021-04-29T08:48:59.701Z',
      i_created_at_year: '2021',
      entity_type: 'Marking-Definition',
      base_type: 'ENTITY',
      updated_at: '2021-04-29T08:48:59.701Z',
      modified: '2020-02-25T09:02:29.040Z',
      definition: 'TLP:TEST',
      id: '329a8250-0beb-4f34-bf9e-5d3897ba43a6',
      x_opencti_stix_ids: ['marking-definition--78ca4366-f5b8-4764-83f7-34ce38198e27'],
      _index: 'opencti_stix_meta_objects-000001',
    },
  ],
  x_opencti: {
    test: 'id',
    val: {
      id: 'ID',
    },
  },
};
const after = {
  standard_id: 'threat-actor--71c2f3be-a4e9-556d-a0ef-d98e819d786e',
  i_created_at_day: '2021-05-03',
  aliases: [
    'THREAT_SOURCE_01',
    'THREAT_SOURCE_02',
    'THREAT_SOURCE_03',
    'THREAT_SOURCE_04',
    'THREAT_SOURCE_05',
    'THREAT_SOURCE_06',
  ],
  spec_version: '2.1',
  parent_types: ['Basic-Object', 'Stix-Object', 'Stix-Core-Object', 'Stix-Domain-Object'],
  internal_id: '6d57c1c1-ea4a-4897-9195-d05186af2917',
  created: '2021-05-03T15:44:57.053Z',
  i_created_at_month: '2021-05',
  confidence: 15,
  description: '',
  created_at: '2021-05-03T15:44:57.053Z',
  revoked: false,
  i_created_at_year: '2021',
  base_type: 'ENTITY',
  entity_type: 'Threat-Actor',
  updated_at: '2021-05-03T15:44:58.615Z',
  name: 'THREAT_MERGE',
  modified: '2021-05-03T15:44:58.615Z',
  i_aliases_ids: [
    'aliases--4dc0a390-33cf-507e-a340-c9c48f4fa60e',
    'aliases--543dc92a-003a-56d5-aa58-2472a851a8bc',
    'aliases--6043f3ab-0824-55bb-b454-3df6d873d05a',
    'aliases--6bcc2815-4164-5893-8204-8ec22a967528',
    'aliases--7ed963fc-c9d7-50c0-9461-8e3503a2c956',
    'aliases--84efe910-263e-5ca1-af18-b129558a7262',
    'aliases--dfa30c3e-75b4-5938-8139-605923aa69fb',
  ],
  id: '6d57c1c1-ea4a-4897-9195-d05186af2917',
  x_opencti_stix_ids: [],
  goals: ['MY GOAL', 'NEW GOAL'],
  _index: 'opencti_stix_domain_objects-000001',
  objectLabel: [
    {
      standard_id: 'label--1f9a882f-2465-575d-b2fe-891b613dc4e2',
      i_created_at_day: '2021-04-29',
      color: '#f2af33',
      internal_id: '26fec1f2-397c-48aa-b00f-76f1f6ad74b1',
      spec_version: '2.1',
      parent_types: ['Basic-Object', 'Stix-Object', 'Stix-Meta-Object'],
      created: '2021-04-29T09:03:06.946Z',
      i_created_at_month: '2021-04',
      created_at: '2021-04-29T09:03:06.946Z',
      i_created_at_year: '2021',
      entity_type: 'Label',
      base_type: 'ENTITY',
      updated_at: '2021-04-29T09:03:06.946Z',
      modified: '2021-04-29T09:03:06.946Z',
      id: '26fec1f2-397c-48aa-b00f-76f1f6ad74b1',
      x_opencti_stix_ids: [],
      value: 'note',
      _index: 'opencti_stix_meta_objects-000001',
    },
    {
      standard_id: 'label--a87ca076-f2b8-5374-a25b-103df133d9d3',
      i_created_at_day: '2021-04-29',
      color: '#34554c',
      internal_id: '53cd9b59-f834-417a-ad5c-6d7f0b8eed07',
      spec_version: '2.1',
      parent_types: ['Basic-Object', 'Stix-Object', 'Stix-Meta-Object'],
      created: '2021-04-29T09:03:08.769Z',
      i_created_at_month: '2021-04',
      created_at: '2021-04-29T09:03:08.769Z',
      i_created_at_year: '2021',
      entity_type: 'Label',
      base_type: 'ENTITY',
      updated_at: '2021-04-29T09:03:08.769Z',
      modified: '2021-04-29T09:03:08.769Z',
      id: '53cd9b59-f834-417a-ad5c-6d7f0b8eed07',
      x_opencti_stix_ids: [],
      value: 'report',
      _index: 'opencti_stix_meta_objects-000001',
    },
    {
      standard_id: 'label--355f76bb-be36-58dd-bdc9-90a75529df85',
      i_created_at_day: '2021-04-29',
      color: '#be70e8',
      internal_id: '4dd598ef-7466-4de8-930a-ef4362a73102',
      spec_version: '2.1',
      parent_types: ['Basic-Object', 'Stix-Object', 'Stix-Meta-Object'],
      created: '2021-04-29T08:48:59.270Z',
      i_created_at_month: '2021-04',
      created_at: '2021-04-29T08:48:59.270Z',
      i_created_at_year: '2021',
      entity_type: 'Label',
      base_type: 'ENTITY',
      updated_at: '2021-04-29T08:48:59.270Z',
      modified: '2021-04-29T08:48:59.270Z',
      id: '4dd598ef-7466-4de8-930a-ef4362a73102',
      x_opencti_stix_ids: [],
      value: 'identity',
      _index: 'opencti_stix_meta_objects-000001',
    },
    {
      standard_id: 'label--66cc3435-328c-5b6b-9a96-1f3bdfb23067',
      i_created_at_day: '2021-04-29',
      color: '#82b3ed',
      internal_id: '80975d7e-cb60-4965-9f95-37261f220e7c',
      spec_version: '2.1',
      parent_types: ['Basic-Object', 'Stix-Object', 'Stix-Meta-Object'],
      created: '2021-04-29T09:03:07.762Z',
      i_created_at_month: '2021-04',
      created_at: '2021-04-29T09:03:07.762Z',
      i_created_at_year: '2021',
      entity_type: 'Label',
      base_type: 'ENTITY',
      updated_at: '2021-04-29T09:03:07.762Z',
      modified: '2021-04-29T09:03:07.762Z',
      id: '80975d7e-cb60-4965-9f95-37261f220e7c',
      x_opencti_stix_ids: [],
      value: 'opinion',
      _index: 'opencti_stix_meta_objects-000001',
    },
  ],
  objectMarking: [
    {
      standard_id: 'marking-definition--907bb632-e3c2-52fa-b484-cf166a7d377c',
      x_opencti_color: '#ffffff',
      x_opencti_order: 0,
      i_created_at_day: '2021-04-29',
      internal_id: '329a8250-0beb-4f34-bf9e-5d3897ba43a6',
      spec_version: '2.1',
      parent_types: ['Basic-Object', 'Stix-Object', 'Stix-Meta-Object'],
      definition_type: 'TLP',
      created: '2020-02-25T09:02:29.040Z',
      i_created_at_month: '2021-04',
      created_at: '2021-04-29T08:48:59.701Z',
      i_created_at_year: '2021',
      entity_type: 'Marking-Definition',
      base_type: 'ENTITY',
      updated_at: '2021-04-29T08:48:59.701Z',
      modified: '2020-02-25T09:02:29.040Z',
      definition: 'TLP:TEST',
      id: '329a8250-0beb-4f34-bf9e-5d3897ba43a6',
      x_opencti_stix_ids: ['marking-definition--78ca4366-f5b8-4764-83f7-34ce38198e27'],
      _index: 'opencti_stix_meta_objects-000001',
    },
    {
      standard_id: 'marking-definition--613f2e26-407d-48c7-9eca-b8e91df99dc9',
      x_opencti_color: '#ffffff',
      x_opencti_order: 1,
      i_created_at_day: '2021-04-29',
      internal_id: '02c76b31-cd55-4239-b6a9-97937d228d62',
      spec_version: '2.1',
      parent_types: ['Basic-Object', 'Stix-Object', 'Stix-Meta-Object'],
      definition_type: 'TLP',
      created: '2021-04-29T08:46:30.807Z',
      i_created_at_month: '2021-04',
      created_at: '2021-04-29T08:46:30.807Z',
      i_created_at_year: '2021',
      entity_type: 'Marking-Definition',
      base_type: 'ENTITY',
      updated_at: '2021-04-29T08:46:30.807Z',
      modified: '2021-04-29T08:46:30.807Z',
      definition: 'TLP:WHITE',
      id: '02c76b31-cd55-4239-b6a9-97937d228d62',
      x_opencti_stix_ids: ['marking-definition--613f2e26-407d-48c7-9eca-b8e91df99dc9'],
      _index: 'opencti_stix_meta_objects-000001',
    },
    {
      standard_id: 'marking-definition--ab216ddd-5f1e-5e6a-88d7-3797fbe5a03f',
      x_opencti_color: '#ffffff',
      x_opencti_order: 0,
      i_created_at_day: '2021-04-29',
      internal_id: 'b2229617-90b4-4522-b615-752f96e32321',
      spec_version: '2.1',
      parent_types: ['Basic-Object', 'Stix-Object', 'Stix-Meta-Object'],
      definition_type: 'statement',
      created: '2017-06-01T00:00:00.000Z',
      i_created_at_month: '2021-04',
      created_at: '2021-04-29T08:49:01.872Z',
      i_created_at_year: '2021',
      entity_type: 'Marking-Definition',
      base_type: 'ENTITY',
      updated_at: '2021-04-29T08:49:01.872Z',
      modified: '2020-02-25T09:07:15.423Z',
      definition: 'Copyright 2017, The MITRE Corporation',
      id: 'b2229617-90b4-4522-b615-752f96e32321',
      x_opencti_stix_ids: ['marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168'],
      _index: 'opencti_stix_meta_objects-000001',
    },
  ],
  x_opencti: {
    test: 'id2',
    val: {
      id: 'ID',
      new_attribute: 'attr',
    },
  },
};
// endregion

test('Should compute merge diff', () => {
  const diff = computeMergeDifferential(previous, after);
  expect(diff.replace.description.previous).toEqual('DESC');
});
