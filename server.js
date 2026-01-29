const express = require('express');
const { createCanvas, loadImage } = require('canvas');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

// 1. Email Configuration (Use App Passwords for Gmail)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'your-email@gmail.com',
        pass: 'your-app-password-here' 
    }
});

// 2. Jotform Webhook Endpoint
app.post('/webhook', async (req, res) => {
    try {
        // Jotform field IDs vary; check your Jotform API/Webhook logs
        const firstName = req.body.q1_name?.first || "User";
        const lastName = req.body.q1_name?.last || "";
        const email = req.body.q2_email || req.body.email;
        const fullName = `Dr. ${firstName} ${lastName}`;

        const imagePath = path.join(__dirname, 'CERTIFICATE_Edited_V4.jpg');
        const buffer = await generateCertificateBuffer(fullName, imagePath);

        // Send Email
        await transporter.sendMail({
            from: '"Telfast DADD" <your-email@gmail.com>',
            to: email,
            subject: "Your DADD Certificate of Commitment",
            text: `Hello Dr. ${lastName}, please find your certificate attached.`,
            attachments: [{ filename: 'Certificate.jpg', content: buffer }]
        });

        res.status(200).send('Success');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error generating certificate');
    }
});

// 3. Logic to draw text on Image
async function generateCertificateBuffer(name, imagePath) {
    const image = await loadImage(imagePath);
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');

    ctx.drawImage(image, 0, 0);
    
    // Styling
    ctx.font = 'bold 45px Arial'; // Adjust size as needed
    ctx.fillStyle = '#5e3378';
    ctx.textAlign = 'center';

    // X: Middle of image, Y: Adjust 515 based on the line position in your JPG
    ctx.fillText(name, image.width / 2, 515);

    return canvas.toBuffer('image/jpeg');
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));