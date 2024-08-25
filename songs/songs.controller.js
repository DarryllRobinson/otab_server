const express = require('express');
const router = express.Router();
const Joi = require('joi');
const validateRequest = require('_middleware/validate-request');
const authorize = require('_middleware/authorize');
const Role = require('_helpers/role');
const songService = require('./song.service');

// Routes
router.get('/:id', getAllByCompId);

module.exports = router;

function getAllByCompId(req, res, next) {
  console.log('get all songs', req.params.id);
  songService
    .getAllByCompId(req.params.id)
    .then((songs) => {
      //   console.log('songs', songs);
      res.json(songs);
    })
    .catch(next);
}
