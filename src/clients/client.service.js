const db = require('../helpers/db');

module.exports = {
  getAll,
  getById,
  getCustomerInvoices,
  bulkCreate,
  create,
  update,
  delete: _delete,
};

async function getAll() {
  try {
    const customers = await db.Customer.findAll();
    return customers.map((x) => basicDetails(x));
  } catch (err) {
    console.log('customerService.getAll error: ', err);
  }
}

async function getById(id) {
  const customer = await getCustomer(id);
  return basicDetails(customer);
}

async function getCustomerInvoices() {
  //const customerInvoices = await db.Customer.findAll();
  const customerInvoices = await db.Customer.findAll({
    attributes: ['customerRefNo', 'customerName'],
    include: [
      {
        model: db.Invoice,
        attributes: ['hasViewed', 'viewed', 'totalBalance'],
      },
    ],
  });
  //console.log('customerInvoices done: ', JSON.stringify(customerInvoices));
  return customerInvoices.map((x) => customerInvoicesDetails(x));
}

function customerInvoicesDetails(invoice) {
  /*if (invoice.customerRefNo === 'AEO101')
    console.log('invoice: ', JSON.stringify(invoice));
  if (invoice.customerRefNo === 'AIM101')
    console.log('invoice: ', JSON.stringify(invoice));*/
  if (invoice.invoices.length > 0) {
    const {
      customerRefNo,
      customerName,
      invoices: [{ hasViewed, viewed, totalBalance }],
    } = invoice;
    return { customerRefNo, customerName, hasViewed, viewed, totalBalance };
  } else {
    const { customerRefNo, customerName } = invoice;
    return { customerRefNo, customerName };
  }
}

async function bulkCreate(params) {
  // Count existing rows to be able to count number of affected rows
  const existingRows = await db.Customer.count({ distinct: 'customerName' });

  await db.Customer.bulkCreate(params);
  const totalRows = await db.Customer.count({ distinct: 'customerName' });

  return totalRows - existingRows;
}

async function create(params) {
  // validate
  if (
    await db.Customer.findOne({ where: { customerName: params.customerName } })
  ) {
    throw 'Customer "' + params.customerName + '" is already registered';
  }

  const customer = new db.Customer(params);

  // save customer
  await customer.save();

  return basicDetails(customer);
}

async function update(id, params) {
  const customer = await getCustomer(id);

  // validate (if email was changed)
  if (
    params.customerName &&
    customer.customerName !== params.customerName &&
    (await db.Customer.findOne({
      where: { customerName: params.customerName },
    }))
  ) {
    throw 'Customer "' + params.customerName + '" is already taken';
  }

  // copy params to customer and save
  Object.assign(customer, params);
  customer.updated = Date.now();
  await customer.save();

  return basicDetails(customer);
}

async function _delete(id) {
  const customer = await getCustomer(id);
  await customer.destroy();
}

// helper functions

async function getCustomer(id) {
  console.log('here I am');
  const customer = await db.Customer.findByPk(id);
  if (!customer) throw 'Customer not found';
  return customer;
}

function basicDetails(customer) {
  const {
    operatorShortCode,
    customerRefNo,
    customerName,
    customerEntity,
    regIdNumber,
    customerType,
    productType,
    address1,
    address2,
    address3,
    address4,
    address5,
    createdAt,
    createdBy,
    updatedAt,
    updatedBy,
    closedDate,
    closedBy,
    regIdStatus,
    f_clientId,
  } = customer;
  return {
    operatorShortCode,
    customerRefNo,
    customerName,
    customerEntity,
    regIdNumber,
    customerType,
    productType,
    address1,
    address2,
    address3,
    address4,
    address5,
    createdAt,
    createdBy,
    updatedAt,
    updatedBy,
    closedDate,
    closedBy,
    regIdStatus,
    f_clientId,
  };
}
