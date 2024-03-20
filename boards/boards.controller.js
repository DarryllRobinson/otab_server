const express = require('express');
const router = express.Router();
const Joi = require('joi');
const validateRequest = require('_middleware/validate-request');
const authorize = require('_middleware/authorize');
const Role = require('_helpers/role');
const boardService = require('./board.service');

// Routes
router.post('/retrieveBoard', retrieveBoard);
router.post('/retrieveBoards', retrieveBoards);

function retrieveBoard(req, res, next) {
  const id = req.id;

  boardService
    .retrieveBoard(id)
    .then((board) => {
      res.json(board);
    })
    .catch(next);
}

function retrieveBoards(req, res, next) {
  // console.log('retrieveBoards');
  boardService
    .retrieveBoards()
    .then((boards) => {
      console.log('retrieveBoards: ', boards);
      res.json(boards);
    })
    .catch(next);
}

module.exports = router;
