const nodemailer = require('nodemailer');
const userConfig = require('user.config.json');

module.exports = sendEmail;

async function sendEmail({ to, subject, html, from = userConfig.emailFrom }) {
  const transporter = nodemailer.createTransport(userConfig.smtpOptions);
  await transporter.sendMail({ from, to, subject, html });
}
