require('dotenv').config();
const express = require('express');
const { createCanvas, loadImage } = require('canvas');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER, // Set in Render Dashboard
        pass: process.env.GMAIL_PASS  // Your 16-character App Password
    }
});

app.post('/webhook', async (req, res) => {
    try {
        // Mapping Jotform fields (verify these IDs in your Jotform account)
        const firstName = req.body.q1_name?.first || "Member";
        const lastName = req.body.q1_name?.last || "";
        const email = req.body.q2_email || req.body.email;
        const fullName = `Dr. ${firstName} ${lastName}`;

        const imagePath = path.join(__dirname, 'CERTIFICATE_Edited_V4.jpg');
        const image = await loadImage(imagePath);
        const canvas = createCanvas(image.width, image.height);
        const ctx = canvas.getContext('2d');

        ctx.drawImage(image, 0, 0);
        ctx.font = 'bold 50px Arial';
        ctx.fillStyle = '#5e3378';
        ctx.textAlign = 'center';

        // Coordinates: Middle width, ~510px height (adjust based on the line)
        ctx.fillText(fullName, image.width / 2, 510);

        const buffer = canvas.toBuffer('image/jpeg');

        await transporter.sendMail({
            from: '"Telfast DADD" <' + process.env.GMAIL_USER + '>',
            to: email,
            subject: "Your DADD Certificate",
            attachments: [{ filename: 'Certificate.jpg', content: buffer }]
        });

        res.status(200).send('Certificate Sent!');
    } catch (err) {
        console.error(err);
        res.status(500).send('Processing Error');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server active on port ${PORT}`));