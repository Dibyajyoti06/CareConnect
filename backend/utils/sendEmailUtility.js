import nodemailer from 'nodemailer';

const SendEmailUtility = async (EmailTo, EmailText, EmailSubject) => {

  try {
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      }
    });

    let mail = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: EmailTo,
      subject: EmailSubject,
      html: EmailText,
    });
    console.log('✅ Email sent successfully!');
  } catch (error) {
    console.error('❌ Error sending email:', error);
  }
};
export default SendEmailUtility;
