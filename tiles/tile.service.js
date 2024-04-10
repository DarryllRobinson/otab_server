const db = require('_helpers/db');

module.exports = { getSong, update, create };

function getSong() {
  console.log('service getting song');
  return true;
}

async function update(id, params) {
  const tile = await getTile(id);

  // Check if tile already submitted
  if (tile.submitted) {
    throw 'Tile already submitted';
  }
  // copy params to tile and save
  Object.assign(tile, params);
  await tile.save();

  return tile;
}

async function getTile(id) {
  const tile = await db.Tile.findByPk(id);
  if (!tile) throw 'Tile not found';
  return tile;
}

async function create(params) {
  const tile = new db.Tile(params);
  // Save tile
  await tile.save();
  return tile;
}
