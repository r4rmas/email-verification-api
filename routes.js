const router = require("express").Router();
const nodemailer = require("nodemailer");
const randomCode = require("./randomCode");
const User = require("./models/User");
const jwt = require("jsonwebtoken");
require("dotenv/config");

router.post("/signup", async (req, res) => {
  //primero deberia verificar que el email no este siendo usado
  //como esto solo es una practica de verificacion de email, esa
  //parte no esta implementada
  const transporter = nodemailer.createTransport({
    host: process.env.HOST_EMAIL,
    port: process.env.PORT_EMAIL,
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASS_EMAIL,
    },
  });
  const verificationCode = randomCode();
  try {
    let user = new User({
      email: req.body.email,
      password: req.body.password,
      verificationCode: verificationCode,
    });
    await user.save();
    await transporter.sendMail({
      from: '"Raul Armas" <ra@raularmas.com>',
      to: req.body.email,
      subject: "Account verification",
      text: verificationCode,
    });
    //no deberia haber dos emails idénticos
    user = await User.findOne({ email: req.body.email });
    const token = jwt.sign(
      { id: user.id, verificationCode: user.verificationCode },
      process.env.JWT_SECRET
    );
    res.json({ status: "OK", token: token });
  } catch (error) {
    res.json({ status: "ERROR" });
  }
  res.send();
});

router.get("/auth", async (req, res) => {
  try {
    const decoded = jwt.verify(req.get("Auth-Token"), process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.json({ status: "ERROR" });
    if (user.verificationCode !== "verified")
      return res.json({ status: "UNVERIFIED" });
    res.json({ status: "OK" });
  } catch (error) {
    res.json({ status: "ERROR" });
  }
});

router.post("/verification", async (req, res) => {
  try {
    const decoded = jwt.verify(req.get("Auth-Token"), process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.json({ status: "ERROR" });
    if (req.body.verificationCode !== user.verificationCode)
      return res.json({ status: "ERROR" });
    user.verificationCode = "verified";
    await user.save();
    res.json({ status: "OK" });
  } catch (error) {
    res.json({ status: "ERROR" });
  }
});

module.exports = router;

//Si al enviar un correo este no se muestra en la seccion de 'Enviados'

//When you send a mail using a regular mail client, such as Thunderbird,
//it will send the mail to your SMTP server, which then relays the message
//to the receiving mail server (also via SMTP). The copy in your sent folder,
//however, is additionally saved on your mail server via IMAP. So your mail
//is actually send twice, once to the receivers mail server, and a copy is
//"send" to your own mail server.

//When using nodemailer you only provide the credentials for your SMTP server,
//so the mail is only send without storing a copy in your sent directory. So
//this is basically working as intended.

//I can think of two ways to save a copy of the mail in the sent directory:

//Use an additional library, such as node-imap to imitate the behavior of a
//regular mail client and manually save a copy of the mail (e.g., node-imap
//has an append method to save new mails).

//Add your own mail address as BCC to all outgoing mails and use some type of
//server side filtering to automatically move them to the sent folder. This is
//computationally less expensive for your application, but has the additional
//filtering requirement for the mail server.
