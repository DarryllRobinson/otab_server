module.exports = validateRequest;

function validateRequest(req, next, schema) {
  // console.log('starting to validate');
  const options = {
    abortEarly: false, // include all errors
    allowUnknown: true, // ignore unknown props
    stripUnknown: true, // remove unknown props
  };
  // console.log('3.0 req.body: ', req.body);
  // console.log('3.0 options: ', options);
  const { error, value } = schema.validate(req.body, options);
  // console.log('3.1 value: ', value);
  if (error) {
    // console.log('validate error: ', error);
    next(`Validation error: ${error.details.map((x) => x.message).join(', ')}`);
  } else {
    // console.log('3.2 req.body: ', req.body);
    // console.log('4 validate passed with value: ', value);
    req.body = value;
    next();
  }
}
