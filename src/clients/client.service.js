const db = require('../helpers/db');

module.exports = {
  getAll,
  getById,
  bulkCreate,
  create,
  update,
  delete: _delete,
};

async function getAll() {
  try {
    const clients = await db.Client.findAll();
    return clients.map((x) => basicDetails(x));
  } catch (err) {
    console.log('clientService.getAll error: ', err);
  }
}

async function getById(id) {
  const client = await getClient(id);
  return basicDetails(client);
}

async function bulkCreate(params) {
  // Count existing rows to be able to count number of affected rows
  const existingRows = await db.Client.count({ distinct: 'clientName' });

  await db.Client.bulkCreate(params);
  const totalRows = await db.Client.count({ distinct: 'clientName' });

  return totalRows - existingRows;
}

async function create(params) {
  // validate
  if (await db.Client.findOne({ where: { clientName: params.clientName } })) {
    throw 'Client "' + params.clientName + '" is already registered';
  }

  const client = new db.Client(params);

  // save client
  await client.save();

  return basicDetails(client);
}

async function update(id, params) {
  const client = await getClient(id);

  // validate (if email was changed)
  if (
    params.clientName &&
    client.clientName !== params.clientName &&
    (await db.Client.findOne({
      where: { clientName: params.clientName },
    }))
  ) {
    throw 'Client "' + params.clientName + '" is already taken';
  }

  // copy params to client and save
  Object.assign(client, params);
  client.updated = Date.now();
  await client.save();

  return basicDetails(client);
}

async function _delete(id) {
  const client = await getClient(id);
  await client.destroy();
}

// helper functions

async function getClient(id) {
  console.log('here I am');
  const client = await db.Client.findByPk(id);
  if (!client) throw 'Client not found';
  return client;
}

function basicDetails(client) {
  const {
    clientName,
    contactFirstName,
    contactLastName,
    contactEmail,
    contactMobile,
    createdAt,
    createdBy,
    updatedAt,
    updatedBy,
    closedDate,
    closedBy,
  } = client;
  return {
    clientName,
    contactFirstName,
    contactLastName,
    contactEmail,
    contactMobile,
    createdAt,
    createdBy,
    updatedAt,
    updatedBy,
    closedDate,
    closedBy,
  };
}
