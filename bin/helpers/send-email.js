const nodemailer = require('nodemailer');
const config = require('./config.js');

module.exports = sendEmail;

async function sendEmail({
  to,
  subject,
  html,
  from = config.emailConfig.emailFrom,
}) {
  const transporter = nodemailer.createTransport(
    config.emailConfig.smtpOptions
  );
  const info = await transporter.sendMail({ from, to, subject, html });
}
