const express = require('express');
const router = express.Router();
const Joi = require('joi');
const validateRequest = require('_middleware/validate-request');
const authorize = require('_middleware/authorize');
const Role = require('_helpers/role');
const tileService = require('./tile.service');

// Routes
router.get('/get-song', getSong);
router.post('/', getTiles);
router.put('/:id', updateSchema, update);
router.post('/', createSchema, create);

module.exports = router;

function getSong(req, res, next) {
  console.log('getting song');
  tileService.getSong();
}

function getTiles(req, res, next) {
  const { boardId } = req.body;
  console.log('getting tiles with boardId: ', boardId);
  // console.log('getting tiles with boardId: ', req.body);
  tileService
    .getTiles(boardId)
    .then((tiles) => {
      console.log('returning tiles with boardId: ', tiles);
      res.json(tiles);
    })
    .catch(next);
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
    artists: Joi.array().required(),
    boardId: Joi.number().required(),
    // artist1: Joi.string().required(),
    // artist2: Joi.string().required(),
    // artist3: Joi.string().required(),
  });
  validateRequest(req, next, schema);
}

function create(req, res, next) {
  // console.log('req.body: ', req.body);
  tileService
    .create(req.body)
    .then((tile) => res.json(tile))
    .catch(next);
}
