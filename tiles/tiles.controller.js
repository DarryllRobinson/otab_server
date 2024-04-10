const express = require('express');
const router = express.Router();
const Joi = require('joi');
const validateRequest = require('_middleware/validate-request');
const authorize = require('_middleware/authorize');
const Role = require('_helpers/role');
const tileService = require('./tile.service');

// Routes
router.get('/get-song', getSong);
router.put('/:id', updateSchema, update);
router.post('/', authorize(), createSchema, create);

module.exports = router;

function getSong(req, res, next) {
  console.log('getting song');
  tileService.getSong();
}

function updateSchema(req, res, next) {
  const schema = Joi.object({
    chosenArtist: Joi.string().required(),
    correctArtist: Joi.boolean().required(),
    correctSong: Joi.boolean().required(),
    submitted: Joi.boolean().required(),
  });
  validateRequest(req, next, schema);
}

function update(req, res, next) {
  console.log('updating controller: ', req.params.id, req.body);
  tileService
    .update(req.params.id, req.body)
    .then((tile) => res.json(tile))
    .catch(next);
}

function createSchema(req, res, next) {
  const schema = Joi.object({
    title: Joi.string().required(),
    artist1: Joi.string().required(),
    artist2: Joi.string().required(),
    artist3: Joi.string().required(),
  });
  validateRequest(req, next, schema);
}

function create(req, res, next) {
  tileService
    .create(req.body)
    .then((tile) => res.json(tile))
    .catch(next);
}
