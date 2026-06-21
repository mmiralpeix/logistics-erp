'use strict';

const { app, BrowserWindow, Tray, Menu, nativeImage, dialog } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');
const fs = require('fs');

const BACKEND_PORT = 3001;
const FRONTEND_PORT = 3000;

let mainWindow = null;
let splashWindow = null;
let tray = null;
let backendProcess = null;
let frontendProcess = null;
let isQuitting = false;

// ─── Paths ────────────────────────────────────────────────────────────────────

function getAppRoot() {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'app')
    : path.join(__dirname, '..');
}

// ─── Health check ─────────────────────────────────────────────────────────────

function pingUrl(url) {
  return new Promise(resolve => {
    const req = http.get(url, res => resolve(res.statusCode < 400));
    req.on('error', () => resolve(false));
    req.setTimeout(1500, () => { req.destroy(); resolve(false); });
  });
}

async function waitForUrl(url, label) {
  for (let i = 0; i < 90; i++) {
    if (await pingUrl(url)) { console.log(`✅ ${label} listo`); return; }
    console.log(`⏳ Esperando ${label} (${i + 1}s)...`);
    await new Promise(r => setTimeout(r, 1000));
  }
  throw new Error(`Tiempo agotado esperando ${label}`);
}

// ─── Servicios ────────────────────────────────────────────────────────────────

function spawnNode(label, scriptArgs, cwd, env = {}) {
  const node = process.platform === 'win32' ? 'node.exe' : 'node';
  console.log(`🚀 Iniciando ${label}...`);
  const proc = spawn(node, scriptArgs, {
    cwd,
    windowsHide: true,
    env: { ...process.env, ...env },
  });
  proc.stdout?.on('data', d => process.stdout.write(`[${label}] ${d}`));
  proc.stderr?.on('data', d => process.stderr.write(`[${label}] ${d}`));
  proc.on('error', err => console.error(`[${label}] Error:`, err.message));
  return proc;
}

async function startServices() {
  const root = getAppRoot();
  const backendDir  = path.join(root, 'backend');
  const frontendDir = path.join(root, 'frontend');

  // NestJS backend
  backendProcess = spawnNode(
    'Backend',
    [path.join(backendDir, 'dist', 'main.js')],
    backendDir,
    { NODE_ENV: 'production', PORT: String(BACKEND_PORT) }
  );

  // Next.js — usa standalone si existe, sino next start
  const standaloneServer = path.join(frontendDir, '.next', 'standalone', 'server.js');
  const frontendEnv = {
    NODE_ENV: 'production',
    PORT: String(FRONTEND_PORT),
    HOSTNAME: 'localhost',
    NEXT_PUBLIC_API_URL: `http://localhost:${BACKEND_PORT}/api`,
  };

  if (fs.existsSync(standaloneServer)) {
    frontendProcess = spawnNode('Frontend', [standaloneServer], frontendDir, frontendEnv);
  } else {
    const nextBin = path.join(frontendDir, 'node_modules', '.bin', 'next');
    frontendProcess = spawnNode(
      'Frontend',
      [nextBin, 'start', '-p', String(FRONTEND_PORT)],
      frontendDir,
      frontendEnv
    );
  }

  // Esperar que ambos estén listos
  await Promise.all([
    waitForUrl(`http://localhost:${BACKEND_PORT}/api/health`, 'Backend API'),
    waitForUrl(`http://localhost:${FRONTEND_PORT}`, 'Frontend'),
  ]);
}

// ─── Ventanas ─────────────────────────────────────────────────────────────────

function createSplash() {
  splashWindow = new BrowserWindow({
    width: 480,
    height: 300,
    frame: false,
    resizable: false,
    center: true,
    alwaysOnTop: true,
    webPreferences: { nodeIntegration: false },
  });
  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
}

function createMain() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 600,
    title: 'LogisticsPro ERP',
    icon: path.join(__dirname, 'icon.ico'),
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadURL(`http://localhost:${FRONTEND_PORT}`);

  mainWindow.once('ready-to-show', () => {
    if (splashWindow) { splashWindow.destroy(); splashWindow = null; }
    mainWindow.show();
    mainWindow.focus();
  });

  // Minimizar a tray en lugar de cerrar
  mainWindow.on('close', e => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });
}

// ─── System Tray ─────────────────────────────────────────────────────────────

function navTo(route) {
  mainWindow?.show();
  mainWindow?.loadURL(`http://localhost:${FRONTEND_PORT}${route}`);
}

function createTray() {
  const iconPath = path.join(__dirname, 'icon.ico');
  const icon = fs.existsSync(iconPath)
    ? nativeImage.createFromPath(iconPath)
    : nativeImage.createEmpty();

  tray = new Tray(icon);
  tray.setToolTip('LogisticsPro ERP');

  const menu = Menu.buildFromTemplate([
    { label: 'LogisticsPro ERP', enabled: false },
    { type: 'separator' },
    { label: '▶  Abrir',      click: () => { mainWindow?.show(); mainWindow?.focus(); } },
    { label: '📊 Dashboard',  click: () => navTo('/dashboard') },
    { label: '🚛 Viajes',     click: () => navTo('/trips') },
    { label: '🚗 Flota',      click: () => navTo('/vehicles') },
    { label: '👤 Conductores',click: () => navTo('/drivers') },
    { label: '💰 Facturación',click: () => navTo('/billing') },
    { type: 'separator' },
    { label: 'Salir', click: () => { isQuitting = true; app.quit(); } },
  ]);

  tray.setContextMenu(menu);
  tray.on('double-click', () => { mainWindow?.show(); mainWindow?.focus(); });
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => { mainWindow?.show(); mainWindow?.focus(); });

  app.whenReady().then(async () => {
    createSplash();
    createTray();

    try {
      if (app.isPackaged) {
        await startServices();
      }
      createMain();
    } catch (err) {
      dialog.showErrorBox(
        'Error al iniciar',
        `No se pudieron iniciar los servicios:\n\n${err.message}\n\n` +
        'Verificá que Node.js y PostgreSQL estén instalados.'
      );
      app.quit();
    }
  });

  app.on('window-all-closed', () => { /* Queda corriendo en el system tray */ });
  app.on('activate', () => { mainWindow?.show(); });
  app.on('before-quit', () => {
    isQuitting = true;
    backendProcess?.kill();
    frontendProcess?.kill();
  });
}
