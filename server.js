if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

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
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS 
    }
});

app.post('/webhook', async (req, res) => {
    try {
        const firstName = req.body.q1_name?.first || "Member";
        const lastName = req.body.q1_name?.last || "";
        const email = req.body.q2_email || req.body.email;
        const fullName = `Dr. ${firstName} ${lastName}`;

        const imagePath = path.join(__dirname, 'Certificate.png');
        const image = await loadImage(imagePath);
        const canvas = createCanvas(image.width, image.height);
        const ctx = canvas.getContext('2d');

        ctx.drawImage(image, 0, 0);
        
        // REFINED COORDINATES & STYLE
        ctx.font = 'bold 50px Arial';
        ctx.fillStyle = '#5e3378'; // Your requested purple
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom'; 

        // Placement: Center width, 508px height (lands perfectly on the line)
        ctx.fillText(fullName, image.width / 2, 508);

        const buffer = canvas.toBuffer('image/jpeg');

        await transporter.sendMail({
            from: `"Telfast DADD" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: "Your DADD Certificate",
            attachments: [{ filename: 'Certificate.png', content: buffer }]
        });

        res.status(200).send('Certificate Sent!');
    } catch (err) {
        console.error("Error details:", err);
        res.status(500).send('Processing Error');
    }
});

// Render requires listening on 0.0.0.0
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server active on port ${PORT}`);
});