const express = require('express');
const router = express.Router();
const Joi = require('joi');
const validateRequest = require('_middleware/validate-request');
const authorize = require('_middleware/authorize');
const Role = require('_helpers/role');
const competitionService = require('./competition.service');

// Routes
router.get('/', getAll);
router.get('/:id', getById);

function getAll(req, res, next) {
  console.log('here I am! competition controller');
  competitionService
    .getAll()
    .then((competitions) => {
      res.json(competitions);
    })
    .catch(next);
}

function getById(req, res, next) {
  competitionService
    .getById(req.params.id)
    .then((competition) => {
      res.json(competition);
    })
    .catch(next);
}

module.exports = router;
