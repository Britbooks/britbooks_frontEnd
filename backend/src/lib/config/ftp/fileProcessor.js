import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import dayjs from 'dayjs';
import { Transform } from 'stream';

import { bulkSyncFromCSV, updateInventoryFields } from '../../../app/services/marketPlaceService.js';
import { mapCsvRowToListing } from '../../../app/services/productRowMapper.js';

const LOG_PATH = path.resolve('./src/ftp-root/staging/outgoing/error-logs');
if (!fs.existsSync(LOG_PATH)) {
  fs.mkdirSync(LOG_PATH, { recursive: true });
}

/**
 * Helper to write a single log line to a stream
 */
function writeLogLine(stream, sku, status, error = '') {
  const line = `"${sku}","${status}","${error.replace(/"/g, '""')}"\n`;
  stream.write(line);
}

/**
 * Factory function to create a fresh Sanitizer for each file.
 * This fixes the issue where subsequent files show "total: 0".
 */
function createCsvSanitizer() {
  return new Transform({
    transform(chunk, encoding, callback) {
      const content = chunk.toString();
      // Replace stray quotes (not at boundaries) with single quotes
      const sanitized = content.replace(/(?<!^|,)"(?!,|$|\r|\n)/g, "'");
      callback(null, sanitized);
    }
  });
}

/**
 * Process FULL product CSV using bulk insert
 */
export async function processCsvFile(type, filePath) {
  const fileName = path.basename(filePath);
  const logFileName = `${type}-log_${dayjs().format('YYYY-MM-DD_HH-mm')}.csv`;
  const logFilePath = path.join(LOG_PATH, logFileName);
  
  const logStream = fs.createWriteStream(logFilePath);
  logStream.write('sku,status,error\n');

  console.log(`👀 Starting Import: ${fileName}`);

  return new Promise((resolve) => {
    const parser = csv({ 
      strict: false,
      mapValues: ({ value }) => value.trim() 
    });

    // CRITICAL FIX: We call createCsvSanitizer() here to get a FRESH stream for this file
    const stream = fs.createReadStream(filePath)
      .pipe(createCsvSanitizer())
      .pipe(parser);

    let batch = [];
    let total = 0;
    let saved = 0;
    const BULK_SIZE = 1000;

    stream.on('data', async (row) => {
      total++;
      
      try {
        const mapped = mapCsvRowToListing(row);
        if (!mapped || !mapped.sku) return;

        batch.push(mapped);

        if (batch.length >= BULK_SIZE) {
          stream.pause(); 
          const currentBatch = [...batch];
          batch = [];

          try {
            await bulkSyncFromCSV(currentBatch);
            saved += currentBatch.length;
            currentBatch.forEach(item => writeLogLine(logStream, item.sku, 'success'));
            console.log(`🎯 Progress: ${saved} rows saved...`);
          } catch (dbErr) {
            console.error('❌ DB Bulk Error:', dbErr.message);
          }
          
          stream.resume();
        }
      } catch (err) {
        writeLogLine(logStream, row.SKU || 'N/A', 'error', err.message);
      }
    });

    stream.on('error', (err) => {
      console.error(`🛑 Stream/Parser Error:`, err.message);
    });

    stream.on('end', async () => {
      if (batch.length > 0) {
        try {
          await bulkSyncFromCSV(batch);
          saved += batch.length;
          batch.forEach(item => writeLogLine(logStream, item.sku, 'success'));
        } catch (dbErr) {
          console.error('❌ Final Batch Error:', dbErr.message);
        }
      }

      logStream.end();
      console.log('---');
      console.log(`📊 SUMMARY for ${fileName}:`, { total, saved });

      if (total > 0 && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`📦 Cleanup complete: ${fileName} removed.`);
      }
      resolve();
    });
  });
}

/**
 * Inventory MODS CSV (Price/Qty Updates)
 */
export async function processInventoryMods(filePath) {
  const fileName = path.basename(filePath);
  const logFileName = `mods-log_${dayjs().format('YYYY-MM-DD_HH-mm')}.csv`;
  const logFilePath = path.join(LOG_PATH, logFileName);
  
  const logStream = fs.createWriteStream(logFilePath);
  logStream.write('sku,status,error\n');

  console.log(`👀 Processing Inventory Updates: ${fileName}`);

  return new Promise((resolve) => {
    const parser = csv({ strict: false });
    const stream = fs.createReadStream(filePath)
      .pipe(createCsvSanitizer()) // Fresh sanitizer for each mods file
      .pipe(parser);
    
    let total = 0;
    let updated = 0;

    stream.on('data', async (row) => {
      total++;
      const sku = row.SKU?.toString().trim();
      const price = Number(row.Price);
      const quantity = Number(row.Quantity);

      if (!sku || isNaN(price) || isNaN(quantity)) return;

      try {
        stream.pause();
        await updateInventoryFields({ sku, price, quantity });
        updated++;
        writeLogLine(logStream, sku, 'success');
        stream.resume();
      } catch (err) {
        writeLogLine(logStream, sku, 'error', err.message);
        stream.resume();
      }
    });

    stream.on('end', () => {
      logStream.end();
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      console.log('📊 MODS SUMMARY:', { total, updated });
      resolve();
    });
  });
}