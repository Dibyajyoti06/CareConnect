import nodemailer from 'nodemailer';

const SendEmailUtility = async (EmailTo, EmailText, EmailSubject) => {
  console.log(EmailTo, EmailText, EmailSubject);
  try {
    let transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: 'janiya.cummings56@ethereal.email',
        pass: 'UdQpECK7BcpkrC1A61',
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    let mail = await transporter.sendMail({
      from: 'janiya.cummings56@ethereal.email',
      to: EmailTo,
      subject: EmailSubject,
      text: 'Hello world?',
      html: EmailText,
    });
    console.log('send mail success');
  } catch (error) {
    console.log(error);
  }
};
export default SendEmailUtility;
