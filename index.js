const express = require('express');
const crypto = require('crypto');
const multer = require('multer');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const app = express();

app.use((req, res, next) => {
  req.id = crypto.randomUUID();
  next();
})

const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    const dir = path.join(__dirname, 'uploads', req.id, 'icons');
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch (err) {
      console.error(err);
    }
    return callback(null, dir);
  },
  filename: function (req, file, callback) {
    callback(null, file.originalname);
  }
})

const upload = multer({ storage: storage });

function zipSprites(folderPath, outputZipPath, callback) {
  const output = fs.createWriteStream(outputZipPath);
  const archive = archiver('zip');

  output.on('close', function () {
    callback(null, outputZipPath);
  });

  archive.on('error', function (err) {
    callback(err);
  });

  archive.pipe(output);

  // Add the sprite files to the archive
  archive.file(path.join(folderPath, 'sprite.json'), { name: 'sprite.json' });
  archive.file(path.join(folderPath, 'sprite.png'), { name: 'sprite.png' });
  archive.file(path.join(folderPath, 'sprite@2x.json'), { name: 'sprite@2x.json' });
  archive.file(path.join(folderPath, 'sprite@2x.png'), { name: 'sprite@2x.png' });

  archive.finalize();
}

app.post('/sprite', upload.array('icons'), (req, res) => {
  // Path where uploaded files are stored
  const uploadPath = path.join(__dirname, 'uploads', req.id);
  const spritePath = path.join(uploadPath, 'output');
  const iconsPath = path.join(uploadPath, 'icons');

  // Command to generate sprite using spritezero-cli
  let command = `mkdir ${spritePath} && spritezero --ratio=2 ${spritePath}/sprite@2x ${iconsPath} && spritezero --ratio=1 ${spritePath}/sprite ${iconsPath}`;

  exec(command, (err, stdout, stderr) => {
    if (err) {
      return res.status(500).send(err.message);
    }

    const zipPath = path.join(spritePath, 'sprites.zip');

    zipSprites(spritePath, zipPath, (zipErr, zipFilePath) => {
      if (zipErr) {
        return res.status(500).send(zipErr.message);
      }

      res.download(zipFilePath, zipPath, (downloadErr) => {
        if (downloadErr) {
          return res.status(500).send(downloadErr.message);
        }

        // Optionally, clean up by deleting the files and the zip after sending
        fs.unlinkSync(zipFilePath);
        fs.rmSync(uploadPath, { recursive: true });
      });
    });
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
