export const rolesMap = {
  targets: {
    source: 'from',
    target: 'to'
  },
  uses: {
    user: 'from',
    usage: 'to'
  },
  'attributed-to': {
    attribution: 'from',
    origin: 'to'
  },
  mitigates: {
    mitigation: 'from',
    problem: 'to'
  },
  indicates: {
    indicator: 'from',
    characterize: 'to'
  },
  'variant-of': {
    variation: 'from',
    original: 'to'
  },
  impersonates: {
    dummy: 'from',
    genuine: 'to'
  },
  'related-to': {
    relate_from: 'from',
    relate_to: 'to'
  },
  localization: {
    localized: 'from',
    location: 'to'
  },
  belonging: {
    part_of: 'from',
    gather: 'to'
  },
  drops: {
    dropping: 'from',
    dropped: 'to'
  },
  tagged: {
    so: 'from',
    tagging: 'to'
  },
  created_by_ref: {
    so: 'from',
    creator: 'to'
  },
  object_marking_refs: {
    so: 'from',
    marking: 'to'
  }
};

export const isInversed = (relationType, fromRole) => {
  if (relationType && fromRole) {
    if (rolesMap[relationType]) {
      if (rolesMap[relationType][fromRole] === 'from') {
        return false;
      }
      if (rolesMap[relationType][fromRole] === 'to') {
        return true;
      }
    }
  }
  return false;
};
