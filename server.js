const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const multer = require('multer');
const app = express();

// Set storage engine for Multer
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// Init upload
const upload = multer({
    storage: storage,
    limits: { fileSize: 10000000 }, // Limit file size to 10MB
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
}).single('file');

// Check file type
function checkFileType(file, cb) {
    // Allowed ext
    const filetypes = /jpeg|jpg|png|gif/;
    // Check ext
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images Only!');
    }
}

// Static folder
app.use(express.static(path.join(__dirname, 'public')));

// Body parser middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/submit-paint-request', (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            res.redirect('/services.html?success=false');
        } else {
            if (req.file == undefined) {
                res.redirect('/services.html?success=false');
            } else {
                // Save the form data to a JSON file
                const formData = {
                    name: req.body.name,
                    email: req.body.email,
                    phone: req.body.phone,
                    message: req.body.message,
                    filePath: req.file.path
                };

                fs.readFile('submissions.json', (err, data) => {
                    let submissions = [];
                    if (!err) {
                        submissions = JSON.parse(data);
                    }
                    submissions.push(formData);
                    fs.writeFile('submissions.json', JSON.stringify(submissions, null, 2), (err) => {
                        if (err) {
                            res.redirect('/services.html?success=false');
                        } else {
                            res.redirect('/services.html?success=true');
                        }
                    });
                });
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
