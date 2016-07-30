module.exports = function() {
  var template = {
    AWSTemplateFormatVersion: '2010-09-09',
    Metadata: {},
    Parameters: {},
    Mappings: {},
    Conditions: {},
    Resources: {},
    Outputs: {}
  };

  for (var arg of arguments) {
    if (arg.Metadata) Object.keys(arg.Metadata).forEach((key) => {
      if (template.Metadata[key]) throw new Error('LogicalName used more than once: Metadata.' + key);
      template.Metadata[key] = arg.Metadata[key];
    });

    if (arg.Parameters) Object.keys(arg.Parameters).forEach((key) => {
      if (template.Parameters[key]) throw new Error('LogicalName used more than once: Parameters.' + key);
      template.Parameters[key] = arg.Parameters[key];
    });

    if (arg.Mappings) Object.keys(arg.Mappings).forEach((key) => {
      if (template.Mappings[key]) throw new Error('LogicalName used more than once: Mappings.' + key);
      template.Mappings[key] = arg.Mappings[key];
    });

    if (arg.Conditions) Object.keys(arg.Conditions).forEach((key) => {
      if (template.Conditions[key]) throw new Error('LogicalName used more than once: Conditions.' + key);
      template.Conditions[key] = arg.Conditions[key];
    });

    if (arg.Resources) Object.keys(arg.Resources).forEach((key) => {
      if (template.Resources[key]) throw new Error('LogicalName used more than once: Resources.' + key);
      template.Resources[key] = arg.Resources[key];
    });

    if (arg.Outputs) Object.keys(arg.Outputs).forEach((key) => {
      if (template.Outputs[key]) throw new Error('LogicalName used more than once: Outputs.' + key);
      template.Outputs[key] = arg.Outputs[key];
    });
  }

  return template;
};
