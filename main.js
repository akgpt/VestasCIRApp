const { app, BrowserWindow, Menu, Tray } = require('electron')
//main process
const path = require('path')
const url = require('url')
const nativeImage = require('electron').nativeImage
const iconPath = path.join(__dirname, './images/CIR_icon.png')
let demoIcon = nativeImage.createFromPath(iconPath)
let win
const fs = require('fs');
const { ipcMain } = require('electron');
const { globalShortcut } = require('electron');
const autoUpdater = require('electron').autoUpdater;
const os = require('os');

// this should be placed at top of main.js to handle setup events quickly
if (handleSquirrelEvent()) {
    // squirrel event handled and app will exit in 1000ms, so don't do anything else
    return;
}

let platform = 'win';
if (process.platform === 'darwin') {
    platform = 'osx';
}

//this will be used to create only one instance of application
var iShouldQuit = app.makeSingleInstance(function (commandLine, workingDirectory) {
    if (win) {
        if (win.isMinimized()) win.restore();
        win.show();
        win.focus();
    }
    return true;
});
if (iShouldQuit) { app.quit(); return; }

let tray = null

function createWindow() {
    win = new BrowserWindow({
        titleBarStyle: 'hidden', webPreferences: {
            preload: "./preload.js",
            icon: demoIcon,
            nodeIntegration: true
        }
    })
    win.maximize()
    win.setMenu(null);
    win.loadURL('file://' + __dirname + '/main.html');
    win.show()
    win.$ = win.jQuery = require('./node_modules/jquery/dist/jquery.min.js');
    win.on('close', function (event) {
        if (!app.isQuiting) {
            event.preventDefault()
            win.hide();
        }
        return false;
    })

    win.onload = () => {
        const $ = require('jquery')
        console.log($('body div').length)
    }
    // win.on('minimize',function(event){
    //     event.preventDefault()
    //     win.hide();
    // })

    appIcon = new Tray(iconPath)
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show App', click: function () {
                win.maximize()
                win.show();
            }
        },
        {
            label: 'Quit', click: function () {
                app.isQuiting = true;
                app.quit();
            }
        }
    ])
    // set Tooltip of icon
    appIcon.setToolTip("CIR Offline App");

    // Call this again for Linux because we modified the context menu
    appIcon.setContextMenu(contextMenu);

    win.openDevTools()
}

//app.on('ready', createWindow)

app.on('ready', () => {
    createWindow();
    globalShortcut.register('CommandOrControl+F5', () => {
        win.reload()
    })
    const feedURL = 'https://cirdevblobstorage.blob.core.windows.net/cirappcontainer';
    autoUpdater.setFeedURL(feedURL);

    autoUpdater.addListener("update-available", function (event) {
        console.log('update available');
    });
    autoUpdater.addListener("update-downloaded", function (event, releaseNotes, releaseName, releaseDate, updateURL) {
        console.log('update downloaded');
        autoUpdater.quitAndInstall();
    });
    autoUpdater.addListener("error", function (error) {
        console.log('error');
    });
    autoUpdater.addListener("checking-for-update", function (event) {
        console.log('checking-for-update');
    });
    autoUpdater.addListener("update-not-available", function (event) {
        console.log('update not available');
    });
    autoUpdater.checkForUpdates();
})

// app.on('window-all-closed', ()=>{
//     if(process.platform != 'darwin'){
//         app.quit()
//     }
// })

app.on('activate', () => {
    if (win == null) {
        createWindow()
    }
})

ipcMain.on('synchronous-message', (event, fileName, operation) => {

})

// Handle install,uninstall,auto update features.
var handleSquirrelEvent = function () {

    if (process.platform != 'win32') {

        return false;

    }

    function executeSquirrelCommand(args, done) {

        var updateDotExe = path.resolve(path.dirname(process.execPath), '..', 'update.exe');

        var child = cp.spawn(updateDotExe, args, { detached: true });

        child.on('close', function (code) {

            done();

        });

    };

    function install(done) {

        var target = path.basename(process.execPath);

        executeSquirrelCommand(["--createShortcut", target], done);

    };

    function uninstall(done) {

        var target = path.basename(process.execPath);

        executeSquirrelCommand(["--removeShortcut", target], done);

    };

    var squirrelEvent = process.argv[1];

    switch (squirrelEvent) {

        case '--squirrel-install':

            install(app.quit);

            return true;

        case '--squirrel-updated':

            install(app.quit);

            return true;

        case '--squirrel-obsolete':

            app.quit();

            return true;

        case '--squirrel-uninstall':

            uninstall(app.quit);

            return true;
    }
    return false;
};