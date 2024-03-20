const express = require('express');
const router = express.Router();
const Joi = require('joi');
const validateRequest = require('_middleware/validate-request');
const authorize = require('_middleware/authorize');
const Role = require('_helpers/role');
const boardService = require('./board.service');

// Routes
router.get('/', authorize, getAll);
router.get('/:id', authorize, getById);

function getAll(req, res, next) {
  boardService
    .getAll()
    .then((boards) => {
      res.json(boards);
    })
    .catch(next);
}

function getById(req, res, next) {
  boardService
    .getById(req.params.id)
    .then((board) => {
      res.json(board);
    })
    .catch(next);
}

module.exports = router;
