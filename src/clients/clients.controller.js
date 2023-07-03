const express = require('express');
const router = express.Router();
const Joi = require('joi');
const validateRequest = require('../middleware/validate-request');
const authorise = require('../middleware/authorise');
const Role = require('../helpers/role');
const clientService = require('./client.service');

// routes
router.get('/', authorise(), getAll);
router.get('/invoices', authorise(), getCustomerInvoices);
router.get('/:id', authorise(), getById);
router.post('/bulk', authorise(), bulkCreate);
router.post('/', authorise(), createSchema, create);
router.put('/:id', authorise(), updateSchema, update);
router.delete('/:id', authorise(), _delete);

module.exports = router;

function getAll(req, res, next) {
  customerService
    .getAll()
    .then((customers) => res.json(customers))
    .catch(next);
}

function getById(req, res, next) {
  customerService
    .getById(req.params.id)
    .then((customer) => (customer ? res.json(customer) : res.sendStatus(404)))
    .catch(next);
}

function createSchema(req, res, next) {
  const schema = Joi.object({
    operatorShortCode: Joi.string(),
    customerRefNo: Joi.string().required(),
    customerName: Joi.string().required(),
    customerEntity: Joi.string().required(),
    regIdNumber: Joi.string(),
    customerType: Joi.string(),
    productType: Joi.string(),
    address1: Joi.string(),
    address2: Joi.string(),
    address3: Joi.string(),
    address4: Joi.string(),
    address5: Joi.string(),
    createdDate: Joi.date(),
    createdBy: Joi.string().required(),
    updatedDate: Joi.date(),
    updatedBy: Joi.string(),
    closedDate: Joi.date(),
    closedBy: Joi.string(),
    regIdStatus: Joi.string(),
    f_clientId: Joi.number().required(),
  });
  validateRequest(req, next, schema);
}

function create(req, res, next) {
  customerService
    .create(req.body)
    .then((customer) => res.json(customer))
    .catch(next);
}

function updateSchema(req, res, next) {
  const schemaRules = {
    operatorShortCode: Joi.string(),
    customerRefNo: Joi.string().required(),
    customerName: Joi.string().required(),
    customerEntity: Joi.string().required(),
    regIdNumber: Joi.string(),
    customerType: Joi.string(),
    productType: Joi.string(),
    address1: Joi.string(),
    address2: Joi.string(),
    address3: Joi.string(),
    address4: Joi.string(),
    address5: Joi.string(),
    createdDate: Joi.date().required(),
    createdBy: Joi.string().required(),
    updatedDate: Joi.date(),
    updatedBy: Joi.string(),
    closedDate: Joi.date(),
    closedBy: Joi.string(),
    regIdStatus: Joi.string(),
    f_clientId: Joi.number().required(),
  };
  validateRequest(req, next, schema);
}

function update(req, res, next) {
  customerService
    .update(req.params.id, req.body)
    .then((customer) => res.json(customer))
    .catch(next);
}

function _delete(req, res, next) {
  customerService
    .delete(req.params.id)
    .then(() => res.json({ message: 'Customer deleted successfully' }))
    .catch(next);
}
