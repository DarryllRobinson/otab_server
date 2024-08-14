const express = require('express');
const router = express.Router();
const Joi = require('joi');
const validateRequest = require('_middleware/validate-request');
const authorize = require('_middleware/authorize');
const Role = require('_helpers/role');
const boardService = require('./board.service');

// WHY DOES AUTHORISE NOT WORK?!?!?
//////////////////

// Routes
router.get('/', getAll);
router.get('/:id', getAllByUserId);
router.post('/', getById);
router.post('/user', getAllByUserId);
router.post('/competition/user', getBoardByCompUserId);

function getAll(req, res, next) {
  // console.log('getting all boards');
  boardService
    .getAll()
    .then((boards) => {
      // console.log('about to return boards: ', boards);
      res.json(boards);
    })
    .catch(next);
}

function getAllByUserId(req, res, next) {
  const { userId } = req.body;
  // console.log('board controller getAllByUserId: ', req.params.id);
  boardService
    .getAllByUserId(userId)
    .then((board) => {
      res.json(board);
    })
    .catch(next);
}

function getById(req, res, next) {
  const { boardId } = req.body;
  // console.log('board controller getById: ', boardId);
  boardService
    .getById(boardId)
    .then((board) => {
      // console.log('about to return board: ', board);
      res.json(board);
    })
    .catch(next);
}

function getBoardByCompUserId(req, res, next) {
  const { compId, userId } = req.body;
  console.log({ compId, userId });
  boardService
    .getBoardByCompUserId(compId, userId)
    .then((board) => {
      res.json(board);
    })
    .catch(next);
}

module.exports = router;
