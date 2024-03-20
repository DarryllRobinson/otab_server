const express = require('express');
const router = express.Router();
const Joi = require('joi');
const validateRequest = require('_middleware/validate-request');
const authorize = require('_middleware/authorize');
const Role = require('_helpers/role');
const boardService = require('./board.service');

// Routes
router.post('/retrieve', retrieve);

function retrieve(req, res, next) {
  const id = req.id;

  boardService
    .retrieve(id)
    .then((board) => {
      res.json(board);
    })
    .catch(next);
}

module.exports = router;
