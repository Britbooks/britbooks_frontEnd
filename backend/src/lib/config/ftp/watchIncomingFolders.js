import fs from 'fs';
import path from 'path';
import { processCsvFile, processInventoryMods } from './fileProcessor.js';

const watchFolders = [
  { type: 'products', path: path.resolve('./src/ftp-root/staging/incoming/products') },
  { type: 'inventory', path: path.resolve('./src/ftp-root/staging/incoming/inventory') }
];

const processingFiles = new Set(); // <-- Track files being processed

export function startWatchingIncomingFiles() {
  watchFolders.forEach(({ type, path: folderPath }) => {
    // 🔥 Ensure folder exists
    if (!fs.existsSync(folderPath)) {
      console.warn(`⚠️ Folder missing, creating: ${folderPath}`);
      fs.mkdirSync(folderPath, { recursive: true });
    }

    try {
      fs.watch(folderPath, (eventType, filename) => {
        if (!filename || !filename.endsWith('.csv')) return;

        const filePath = path.join(folderPath, filename);

        // Skip if already processing or file does not exist
        if (processingFiles.has(filePath) || !fs.existsSync(filePath)) return;

        processingFiles.add(filePath); // lock file
        console.log(`👀 Detected new file: ${filename}`);

        (async () => {
          try {
            if (type === 'products') {
              await processCsvFile(type, filePath);
            } else if (type === 'inventory') {
              await processInventoryMods(filePath);
            }
          } catch (err) {
            console.error(`❌ Error processing ${filename}:`, err.message);
          } finally {
            processingFiles.delete(filePath); // unlock
          }
        })();
      });

      console.log(`🚨 Watching for ${type} files in: ${folderPath}`);

    } catch (err) {
      console.error(`❌ Failed to watch ${folderPath}:`, err.message);
    }
  });
}
