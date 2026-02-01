if (process.env.NODE_ENV !== 'production') require('dotenv').config();

const express = require('express');
const axios = require('axios');
const path = require('path');
const nodemailer = require('nodemailer');
const { createCanvas, loadImage } = require('canvas');
const PDFDocument = require('pdfkit');
const fs = require('fs');

const app = express();
app.use(express.static('public')); // Serves the frontend

// Configure Gmail transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
    }
});

// THE PROCESS ROUTE (Triggered by Jotform Redirect)
app.get('/process-certificate', async (req, res) => {
    const submissionId = req.query.submission_id;
    const apiKey = process.env.JOTFORM_API_KEY;

    if (!submissionId) return res.send("Error: No Submission ID found.");

    try {
        // 1. Fetch Data from Jotform API
        const response = await axios.get(`https://api.jotform.com/submission/${submissionId}?apiKey=${apiKey}`);
        const answers = response.data.content.answers;

        // 2. Extract Name and Email Dynamically
        let firstName = "Doctor";
        let lastName = "";
        let userEmail = "";

        for (let key in answers) {
            const field = answers[key];
            if (field.type === 'control_fullname') {
                firstName = field.answer.first;
                lastName = field.answer.last;
            }
            if (field.type === 'control_email') {
                userEmail = field.answer;
            }
        }

        const fullName = `Dr. ${firstName} ${lastName}`;

        if (!userEmail) {
            return res.send("Error: No email address found in submission.");
        }

        // 3. Generate Certificate Image
        const certificateBuffer = await generateCertificate(fullName);

        // 4. Create PDF from Certificate
        const pdfBuffer = await createPDF(certificateBuffer);

        // 5. Send Email with PDF Attachment
        await sendCertificateEmail(userEmail, fullName, pdfBuffer);

        // 6. Redirect to Frontend with Success Message
        res.redirect(`/?name=${encodeURIComponent(fullName)}&email=${encodeURIComponent(userEmail)}&status=sent`);

    } catch (err) {
        console.error("Error:", err.message);
        res.status(500).send(`Error processing certificate: ${err.message}`);
    }
});

// Generate Certificate Image with Name
async function generateCertificate(name) {
    // Load the certificate template
    const img = await loadImage(path.join(__dirname, 'Certificate.jpg'));

    // Create canvas with same dimensions as image
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');

    // Draw the certificate template
    ctx.drawImage(img, 0, 0);

    // Draw the name on the certificate
    ctx.font = 'bold 180px Poppins';
    ctx.fillStyle = '#5e3378'; // Purple color
    ctx.textAlign = 'center';
    ctx.fillText(name, canvas.width / 2, 1250);

    // Return as buffer
    return canvas.toBuffer('image/jpeg', { quality: 1.0 });
}

// Create PDF from Certificate Image
function createPDF(imageBuffer) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
            size: [3508, 2480], // A4 landscape in pixels (300 DPI)
            margin: 0
        });

        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Add the certificate image to PDF
        doc.image(imageBuffer, 0, 0, {
            width: 3508,
            height: 2480
        });

        doc.end();
    });
}

// Send Email with Certificate PDF
async function sendCertificateEmail(email, name, pdfBuffer) {
    const mailOptions = {
        from: `"Telfast DADD Certificate" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: 'Your DADD Certificate - Telfast',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #5e3378;">Congratulations, ${name}!</h2>
                <p>Thank you for registering for the DADD event.</p>
                <p>Please find your certificate attached to this email.</p>
                <br>
                <p style="color: #666; font-size: 12px;">Best regards,<br>Opella Team</p>
            </div>
        `,
        attachments: [
            {
                filename: 'DADD_Certificate.pdf',
                content: pdfBuffer,
                contentType: 'application/pdf'
            }
        ]
    };

    await transporter.sendMail(mailOptions);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on ${PORT}`));
