import nodemailer from 'nodemailer';
import env from "./env.js"

export const sendEmail = async (data)=>{
    const transport = nodemailer.createTransport({
         host: 'smtp.gmail.com',
         port:'465',
         secure:true,
         auth:{
             user:`${env.node_mailer_user}`,
             pass:`${env.node_mailer_pass}`
         }
     });
     const info = await transport.sendMail({
           from :`Krptonite <aliOfficialSolomon@gmail.com`,
            to: data.email,
            subject: data.subject,
            html: data.html
         });
     console.log("message sent" + info.messageId);
 }


 