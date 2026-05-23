/**
 * System Metrics Collector
 * Samples CPU, RAM, disk, network, processes every 10 seconds
 * using only Node.js built-in `os` module (no native deps required).
 */

import os from 'os';
import fs from 'fs';
import SystemMetric from '../models/SystemMetric.js';

let intervalHandle = null;
let prevCpuTimes = null;
const prevNetStats = {};
const prevDiskStats = {};

// ─── CPU ─────────────────────────────────────────────────────────────────────

function getCpuPercent() {
  const cpus = os.cpus();

  if (!prevCpuTimes) {
    prevCpuTimes = cpus.map(c => ({ ...c.times }));
    return { usagePercent: 0, perCore: cpus.map(() => 0), model: cpus[0]?.model, cores: cpus.length, speed: cpus[0]?.speed };
  }

  const perCore = cpus.map((cpu, i) => {
    const prev = prevCpuTimes[i];
    const curr = cpu.times;

    const prevTotal = Object.values(prev).reduce((a, b) => a + b, 0);
    const currTotal = Object.values(curr).reduce((a, b) => a + b, 0);

    const prevIdle = prev.idle;
    const currIdle = curr.idle;

    const totalDiff = currTotal - prevTotal;
    const idleDiff = currIdle - prevIdle;

    return totalDiff === 0 ? 0 : parseFloat(((1 - idleDiff / totalDiff) * 100).toFixed(2));
  });

  prevCpuTimes = cpus.map(c => ({ ...c.times }));

  const usagePercent = parseFloat((perCore.reduce((a, b) => a + b, 0) / perCore.length).toFixed(2));

  return {
    usagePercent,
    perCore,
    model: cpus[0]?.model,
    cores: cpus.length,
    speed: cpus[0]?.speed,
  };
}

// ─── Memory ──────────────────────────────────────────────────────────────────

function getMemoryStats() {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;

  // Try to read swap from /proc/meminfo on Linux
  let swapTotal = 0, swapUsed = 0, swapFree = 0;
  try {
    if (process.platform === 'linux') {
      const memInfo = fs.readFileSync('/proc/meminfo', 'utf8');
      const swapTotalMatch = memInfo.match(/SwapTotal:\s+(\d+)/);
      const swapFreeMatch = memInfo.match(/SwapFree:\s+(\d+)/);
      if (swapTotalMatch) swapTotal = parseInt(swapTotalMatch[1]) * 1024;
      if (swapFreeMatch) swapFree = parseInt(swapFreeMatch[1]) * 1024;
      swapUsed = swapTotal - swapFree;
    }
  } catch { /* not on Linux or no permission */ }

  return {
    totalBytes: total,
    usedBytes: used,
    freeBytes: free,
    usagePercent: parseFloat(((used / total) * 100).toFixed(2)),
    swapTotal,
    swapUsed,
    swapFree,
  };
}

// ─── Load Average ─────────────────────────────────────────────────────────────

function getLoadAvg() {
  const [oneMin, fiveMin, fifteenMin] = os.loadavg();
  return {
    oneMin: parseFloat(oneMin.toFixed(2)),
    fiveMin: parseFloat(fiveMin.toFixed(2)),
    fifteenMin: parseFloat(fifteenMin.toFixed(2)),
  };
}

// ─── Network ─────────────────────────────────────────────────────────────────

function getNetworkStats() {
  const ifaces = os.networkInterfaces();
  const results = [];

  for (const [name, addrs] of Object.entries(ifaces || {})) {
    if (!addrs) continue;

    // Try /proc/net/dev on Linux for byte counts
    const prev = prevNetStats[name] || { rxBytes: 0, txBytes: 0, rxPackets: 0, txPackets: 0 };

    try {
      if (process.platform === 'linux') {
        const netDev = fs.readFileSync('/proc/net/dev', 'utf8');
        const match = netDev.split('\n').find(l => l.trim().startsWith(`${name  }:`));
        if (match) {
          const parts = match.trim().split(/\s+/);
          const curr = {
            rxBytes: parseInt(parts[1]),
            txBytes: parseInt(parts[9]),
            rxPackets: parseInt(parts[2]),
            txPackets: parseInt(parts[10]),
            rxErrors: parseInt(parts[3]),
            txErrors: parseInt(parts[11]),
          };
          prevNetStats[name] = curr;
          results.push({
            interface: name,
            rxBytesPerSec: Math.max(0, curr.rxBytes - prev.rxBytes) / 10,
            txBytesPerSec: Math.max(0, curr.txBytes - prev.txBytes) / 10,
            rxPacketsPerSec: Math.max(0, curr.rxPackets - prev.rxPackets) / 10,
            txPacketsPerSec: Math.max(0, curr.txPackets - prev.txPackets) / 10,
            rxErrors: curr.rxErrors,
            txErrors: curr.txErrors,
          });
          continue;
        }
      }
    } catch { /* fallthrough */ }

    results.push({
      interface: name,
      rxBytesPerSec: 0,
      txBytesPerSec: 0,
      rxPacketsPerSec: 0,
      txPacketsPerSec: 0,
      rxErrors: 0,
      txErrors: 0,
    });
  }

  return results;
}

// ─── Disk ─────────────────────────────────────────────────────────────────────

function getDiskStats() {
  const disks = [];

  try {
    if (process.platform === 'linux') {
      // Parse /proc/mounts for mount points
      const mounts = fs.readFileSync('/proc/mounts', 'utf8')
        .split('\n')
        .filter(l => l.startsWith('/'))
        .map(l => {
          const [device, mount, fsType] = l.split(' ');
          return { device, mount, fsType };
        });

      // Parse /proc/diskstats for I/O
      const diskstats = fs.readFileSync('/proc/diskstats', 'utf8')
        .split('\n')
        .filter(Boolean)
        .map(l => {
          const p = l.trim().split(/\s+/);
          return { dev: p[2], readSectors: parseInt(p[5]), writeSectors: parseInt(p[9]), readIos: parseInt(p[3]), writeIos: parseInt(p[7]) };
        });

      for (const { device, mount, fsType } of mounts.slice(0, 5)) {
        const devName = device.split('/').pop();
        const prev = prevDiskStats[devName] || {};
        const curr = diskstats.find(d => d.dev === devName) || {};
        prevDiskStats[devName] = curr;

        const sectorSize = 512;
        const readBytesPerSec = ((curr.readSectors || 0) - (prev.readSectors || 0)) * sectorSize / 10;
        const writeBytesPerSec = ((curr.writeSectors || 0) - (prev.writeSectors || 0)) * sectorSize / 10;
        const iopsRead = ((curr.readIos || 0) - (prev.readIos || 0)) / 10;
        const iopsWrite = ((curr.writeIos || 0) - (prev.writeIos || 0)) / 10;

        disks.push({
          mount,
          device,
          fsType,
          totalBytes: 0,   // Would need df syscall; placeholder
          usedBytes: 0,
          freeBytes: 0,
          usagePercent: 0,
          readBytesPerSec: Math.max(0, readBytesPerSec),
          writeBytesPerSec: Math.max(0, writeBytesPerSec),
          iopsRead: Math.max(0, iopsRead),
          iopsWrite: Math.max(0, iopsWrite),
        });
      }
    } else if (process.platform === 'darwin') {
      disks.push({ mount: '/', device: 'disk0', fsType: 'apfs', totalBytes: 0, usedBytes: 0, freeBytes: 0, usagePercent: 0, readBytesPerSec: 0, writeBytesPerSec: 0, iopsRead: 0, iopsWrite: 0 });
    }
  } catch { /* not on Linux / no permission */ }

  return disks;
}

// ─── Processes ───────────────────────────────────────────────────────────────

function getProcessStats() {
  let total = 0, running = 0, sleeping = 0;
  const zombie = 0;
  try {
    if (process.platform === 'linux') {
      const stat = fs.readFileSync('/proc/stat', 'utf8');
      const procs = stat.match(/procs_running (\d+)/);
      const blocked = stat.match(/procs_blocked (\d+)/);
      running = procs ? parseInt(procs[1]) : 0;
      sleeping = blocked ? parseInt(blocked[1]) : 0;
      // Count /proc/[pid] dirs for total
      const dirs = fs.readdirSync('/proc').filter(d => /^\d+$/.test(d));
      total = dirs.length;
    }
  } catch { /* not on Linux */ }

  return { total, running, sleeping, zombie };
}

// ─── File Descriptors ────────────────────────────────────────────────────────

function getFdStats() {
  let open = 0, limit = 65536;
  try {
    if (process.platform === 'linux') {
      const fdInfo = fs.readFileSync('/proc/sys/fs/file-nr', 'utf8');
      const parts = fdInfo.trim().split(/\s+/);
      open = parseInt(parts[0]);
      limit = parseInt(parts[2]);
    }
  } catch { /* not on Linux */ }
  return { open, limit };
}

// ─── Temperature ─────────────────────────────────────────────────────────────

function getTemperatureStats() {
  const temps = [];
  try {
    if (process.platform === 'linux') {
      const thermalBase = '/sys/class/thermal';
      if (fs.existsSync(thermalBase)) {
        const zones = fs.readdirSync(thermalBase).filter(z => z.startsWith('thermal_zone'));
        for (const zone of zones.slice(0, 5)) {
          const tempRaw = fs.readFileSync(`${thermalBase}/${zone}/temp`, 'utf8').trim();
          const typeRaw = fs.readFileSync(`${thermalBase}/${zone}/type`, 'utf8').trim();
          temps.push({ sensor: typeRaw, celsius: parseInt(tempRaw) / 1000 });
        }
      }
    }
  } catch { /* not accessible */ }
  return temps;
}

// ─── Sample & Persist ────────────────────────────────────────────────────────

async function sample() {
  try {
    const metric = {
      timestamp: new Date(),
      environment: process.env.NODE_ENV || 'production',
      cpu: getCpuPercent(),
      memory: getMemoryStats(),
      disk: getDiskStats(),
      network: getNetworkStats(),
      loadAvg: getLoadAvg(),
      processes: getProcessStats(),
      fileDescriptors: getFdStats(),
      uptime: os.uptime(),
      temperature: getTemperatureStats(),
      tier: 'raw',
    };

    await SystemMetric.create(metric);
  } catch (err) {
    console.error('[SystemMetrics] Failed to save metric:', err.message);
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function startSystemMetrics(intervalMs = 10_000) {
  if (intervalHandle) return;
  // First sample after 2s (let DB connect first)
  setTimeout(sample, 2000);
  intervalHandle = setInterval(sample, intervalMs);
  console.log('[SystemMetrics] Started — sampling every', intervalMs / 1000, 'seconds');
}

export function stopSystemMetrics() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}

export async function getLatestSystemMetric() {
  return SystemMetric.findOne({ tier: 'raw' }).sort({ timestamp: -1 }).lean();
}

export async function getSystemMetricHistory(fromDate, toDate, tier = 'raw') {
  return SystemMetric.find({
    tier,
    timestamp: { $gte: fromDate, $lte: toDate },
  }).sort({ timestamp: 1 }).lean();
}
