const nodemailer = require("nodemailer");
const hbs = require("nodemailer-express-handlebars").default || require("nodemailer-express-handlebars");
const { join } = require("path");

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
});

transporter.use('compile', hbs({
  viewEngine: {
    extName: '.hbs',
    partialsDir: join(__dirname, '..', '..', 'templates'),
    layoutsDir: join(__dirname, '..', '..', 'templates'),
    defaultLayout: false,
  },
  viewPath: join(__dirname, '..', '..', 'templates'),
  extName: '.hbs',
}));

transporter.verify().then(() => {
    console.log("Mailer is ready to send messages");
});