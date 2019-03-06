import build = require('./lib/build');
import validate = require('./lib/validate');
import merge = require('./lib/merge');
import shortcuts = require('./lib/shortcuts');
import { base64, findInMap, getAtt, getAzs,
         join, select, ref, userData, sub, importValue,
         split, arn } from './lib/intrinsic';
import { and, equals, if as _if, not, or, notEquals } from './lib/conditions';
import { accountId, notificationArns, noValue, region,
         stackId, stackName, partition, urlSuffix } from './lib/pseudo';

export const permissions: object
export { shortcuts };

export { build };
export { validate };
export { merge };

/* intrinsic */
export { base64 };
export { findInMap };
export { getAtt };
export { getAzs };
export { join };
export { select };
export { ref };
export { userData };
export { sub };
export { importValue };
export { split };
export { arn };

/* conditions */
export { and }
export { equals }
export { _if as if } // weird case since `if` is reserved word
export { not }
export { or }
export { notEquals }

/* pseudo */
export { accountId }
export { notificationArns };
export { noValue };
export { region };
export { stackId };
export { stackName };
export { partition };
export { urlSuffix };
