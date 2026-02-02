# Telfast DADD Certificate Generator

A static web application for generating and downloading DADD (Drug Allergy Diagnosis and Documentation) certificates for the Telfast Allergy Academy.

## 🌐 Live Demo

Once deployed to GitHub Pages, access certificates using this URL format:

```
https://yourusername.github.io/repo-name/?name=Dr.%20John%20Doe&date=02/02/26
```

## 📋 URL Parameters

- **name**: The participant's name (will be displayed on the certificate)
- **date**: Submission date in `dd/mm/yy` format (e.g., `02/02/26`)

### Example URLs

```
?name=Dr.%20Sarah%20Smith&date=15/01/26
?name=Dr.%20Ahmed%20Hassan&date=02/02/26
```

## 🚀 Deployment to GitHub Pages

### Step 1: Create GitHub Repository

1. Go to [GitHub](https://github.com) and create a new repository
2. Name it something like `Telfast_Certificate_Generator`
3. Don't initialize with README (we already have one)

### Step 2: Push Code to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Static certificate generator"

# Add remote (replace with your repository URL)
git remote add origin https://github.com/yourusername/Telfast_Certificate_Generator.git

# Push to GitHub
git push -u origin main
```

### Step 3: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under **Source**, select `main` branch
4. Select `/public` folder (or root if you move files there)
5. Click **Save**
6. Your site will be live at: `https://yourusername.github.io/Telfast_Certificate_Generator/`

## 🎨 Features

- ✅ Client-side certificate generation
- ✅ Custom name and date on certificate
- ✅ PDF download functionality
- ✅ Responsive design
- ✅ No server required (fully static)

## 📁 Project Structure

```
public/
├── index.html          # Main application
├── style.css           # Custom styles
└── Certificate.jpeg    # Certificate template
```

## 🛠️ Local Development

Simply open `public/index.html` in a browser with URL parameters:

```
file:///path/to/public/index.html?name=Dr.%20John%20Doe&date=02/02/26
```

Or use a local server:

```bash
cd public
python -m http.server 8000
# Then visit: http://localhost:8000/?name=Dr.%20John%20Doe&date=02/02/26
```

## 📝 Generating Certificate Links

To generate a certificate link for a participant:

1. Get their name and submission date
2. URL encode the name (spaces become `%20`)
3. Format the date as `dd/mm/yy`
4. Combine: `https://yourusername.github.io/repo-name/?name=ENCODED_NAME&date=DD/MM/YY`

### JavaScript Helper Function

```javascript
function generateCertificateURL(name, date) {
  const baseURL = 'https://yourusername.github.io/Telfast_Certificate_Generator/';
  return `${baseURL}?name=${encodeURIComponent(name)}&date=${date}`;
}

// Example usage:
const url = generateCertificateURL('Dr. Sarah Smith', '02/02/26');
console.log(url);
```

## 🎯 Usage

1. Share the certificate URL with participants
2. They can view their certificate in the browser
3. Click "Save as PDF" to download

## 📄 License

© Opella - Telfast Allergy Academy
