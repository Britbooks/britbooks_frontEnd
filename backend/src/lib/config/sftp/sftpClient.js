import SftpClient from 'ssh2-sftp-client';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { startWatchingIncomingFiles } from '../ftp/watchIncomingFolders.js';

dotenv.config();

const remoteConfig = {
  host: process.env.SFTP_HOST || '168.231.116.174',
  port: process.env.SFTP_PORT || 22,
  username: process.env.SFTP_USER || 'eagle',
  password: process.env.SFTP_PASS,
};

const localBase = path.resolve('./src/ftp-root/staging/incoming');
const processingBase = path.resolve('./src/ftp-root/staging/processing');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// ----------------------------
// 🔒 Prevent too many requests
// ----------------------------
let isSyncRunning = false;

// Start watcher for incoming
startWatchingIncomingFiles();

export async function syncSftp() {
  if (isSyncRunning) {
    console.log("⏳ Sync already running, skipping…");
    return;
  }

  isSyncRunning = true;
  console.log("🔄 Starting SFTP sync cycle…");

  const client = new SftpClient();

  try {
    await client.connect(remoteConfig);
    console.log('🔑 Connected to SFTP');

    const mappings = [
      { remote: '/uploads/products', local: path.join(localBase, 'products'), processing: null },
      { remote: '/uploads/inventory', local: path.join(localBase, 'inventory'), processing: path.join(processingBase, 'inventory') },
      { remote: '/uploads/listings', local: path.join(localBase, 'listings'), processing: path.join(processingBase, 'listings') },
      { remote: '/uploads/orders/incoming', local: path.join(localBase, 'orders/incoming'), processing: path.join(processingBase, 'orders/incoming') },
      { remote: '/uploads/orders/outgoing', local: path.join(localBase, 'orders/outgoing'), processing: null },
    ];

    for (const { remote, local, processing } of mappings) {
      ensureDir(local);
      if (processing) ensureDir(processing);

      // 👉 Only one request per directory
      let fileList;
      try {
        fileList = await client.list(remote);
      } catch (err) {
        console.warn(`⚠️ Cannot list ${remote}: ${err.message}`);
        continue;
      }

      if (!fileList.length) continue;

      // -----------------------------------
      // 🚚 NEW: Outgoing orders batching
      // -----------------------------------
      if (remote.includes('/orders/outgoing')) {
        console.log(`📤 Skipping outgoing folder; files will remain untouched`);
        continue;
      }
      

      // -----------------------------------
      // 📥 Regular incoming (inventory, responses)
      // -----------------------------------
      for (const file of fileList) {
        if (!file.name.endsWith('.csv')) continue;

        const remotePath = `${remote}/${file.name}`;
        const localPath = path.join(local, file.name);
        const tempPath = `${localPath  }.tmp`;

        if (processing) {
          const processingPath = path.join(processing, file.name);
          if (fs.existsSync(processingPath)) continue;

          await client.fastGet(remotePath, tempPath);
          fs.renameSync(tempPath, processingPath);
          console.log(`📥 Moved to processing: ${processingPath}`);

          // ONLY incoming responses
          if (remote.includes('/orders/incoming')) {
            try {
              const { parseOrderResponseCSV } = await import('../../integration/parseEagleOrderResponse.js');
              await parseOrderResponseCSV(processingPath);
              console.log(`📝 Parsed: ${file.name}`);
            } catch (err) {
              console.error(`❌ Parse error: ${err.message}`);
            }
          }
        }

        // Products — safe write
        if (remote.includes('/products')) {
          if (!fs.existsSync(localPath)) {
            await client.fastGet(remotePath, tempPath);
            fs.renameSync(tempPath, localPath);
            await client.delete(remotePath);
            console.log(`📦 Product ready: ${file.name}`);
          }
        }
      }
    }

    await client.end();
    console.log("✅ Sync cycle complete");
  } catch (err) {
    console.error("❌ SFTP sync error:", err.message);
  } finally {
    isSyncRunning = false; // unlock for next cycle
  }
}

// ----------------------------
// Timer (only 1 request/minute)
// ----------------------------
export function startSftpSync(intervalMs = 60000) {
  console.log(`⏱ Running sync every ${intervalMs / 1000}s`);
  syncSftp();
  setInterval(syncSftp, intervalMs);
}

// ----------------------------------
// Single upload (used by your code)
// ----------------------------------
export async function uploadToSftp(localFilePath, remoteDir = '/uploads/orders/outgoing') {
  const client = new SftpClient();
  const fileName = path.basename(localFilePath);

  if (!fs.existsSync(localFilePath)) {
    throw new Error(`Local file not found: ${localFilePath}`);
  }

  try {
    await client.connect(remoteConfig);

    // 🛑 Prevent remoteDir from accidentally containing a file name
    if (remoteDir.endsWith('.csv')) {
      remoteDir = path.posix.dirname(remoteDir);
    }

    const remotePath = `${remoteDir}/${fileName}`;

    await client.put(localFilePath, remotePath);
    console.log(`✅ Uploaded: ${fileName} → ${remotePath}`);

    const remoteFiles = await client.list(remoteDir);
    if (!remoteFiles.some(f => f.name === fileName)) {
      console.warn(`⚠️ File not visible remotely, retrying...`);
      await client.put(localFilePath, remotePath);
    }

    console.log(`🎉 File confirmed on SFTP: ${fileName}`);

    await client.end();
  } catch (err) {
    console.error('❌ SFTP upload failed:', err.message);
    try { await client.end(); } catch { /* ignored */ }
  }
}











// ------------------------------------
export async function listSftpDir(remoteDir) {
  const client = new SftpClient();
  try {
    await client.connect(remoteConfig);
    const files = await client.list(remoteDir);
    await client.end();
    return files;
  } catch (err) {
    console.error('❌ list error:', err.message);
    return [];
  }
}
