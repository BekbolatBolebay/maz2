const Jimp = require('jimp');
const path = require('path');
const fs = require('fs');

const SOURCE_ICON = path.join(__dirname, 'public', 'logo-source.png');
const PUBLIC_DIR = path.join(__dirname, 'public');

const SIZES = [
    { size: 192, name: 'icon-192x192.png' },
    { size: 512, name: 'icon-512x512.png' },
    { size: 180, name: 'apple-touch-icon.png' },
    { size: 32, name: 'favicon-32x32.png' },
    { size: 16, name: 'favicon-16x16.png' }
];

async function generateIcons() {
    if (!fs.existsSync(SOURCE_ICON)) {
        console.error('Source icon not found at:', SOURCE_ICON);
        console.log('Please place your logo as "public/logo-source.png" first.');
        return;
    }

    try {
        const image = await Jimp.read(SOURCE_ICON);

        for (const { size, name } of SIZES) {
            console.log(`Generating ${name} (${size}x${size})...`);
            await image
                .clone()
                .resize(size, size)
                .write(path.join(PUBLIC_DIR, name));
        }

        console.log('All icons generated successfully!');
    } catch (err) {
        console.error('Error generating icons:', err);
    }
}

generateIcons();
