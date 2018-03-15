const { ipcRenderer } = require('electron')
const fs = require('fs');
const path = require('path');
const url = require('url');

global.isElectronApp = true;

//send message from webpage to webview
global.sendDataToElectron = (data) => {
    ipcRenderer.sendToHost(data)
}

global.callUpdate = (data) => {
    alert('installed');
}

//send message from webview to webpage
global.callElectronApp = (operation, fileName, imageData) => {
    var retVal = receiveData(operation, fileName, imageData);
    return retVal // returns "fromMainProcess"
}

function receiveData(operation, fileName, imageData) {
    var fs = require("fs");
    var returnValue;
    var obj;
    var filepath = "";
    if (operation == "Read" && fileName != undefined) {
        try {
            var imgData = GetFilesList(fileName);
            returnValue = imgData;
        } catch (e) {
            console.log('Error:', e.stack);
            returnValue = e.stack;
        }
    }
    else if (operation == "Read") {
        filepath = "pendingCIRs.json";
        if (fs.existsSync(filepath)) {
            try {
                var data = fs.readFileSync(filepath, 'utf8');
                obj = JSON.parse(data);
                if (obj.table.length > 0) {
                    filepath = obj.table[0].CIRId;
                    try {
                        var imgData = GetFilesList(filepath);
                        returnValue = imgData;
                    } catch (e) {
                        console.log('Error:', e.stack);
                        returnValue = e.stack;
                    }
                }
                else {
                    returnValue = "No CIR image data pending for Syncing";
                }
            } catch (e) {
                console.log('Error:', e.stack);
                returnValue = e.stack;
            }
        }
        else {
            returnValue = "Pending CIR file missing";
        }
    }
    else if (operation == "RemoveSyncedImage") {
        filepath = fileName + '/' + imageData + ".json";
        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
            var files = fs.readdirSync(fileName);
            if (!files.length) {
                fs.rmdirSync(fileName);
                filepath = "pendingCIRs.json";
                if (fs.existsSync(filepath)) {
                    try {
                        var data = fs.readFileSync(filepath, 'utf8');
                        obj = JSON.parse(data);
                    } catch (e) {
                        console.log('Error:', e.stack);
                        returnValue = e.stack;
                    }
                    if (obj.table.length > 0) {
                        obj.table.pop({ CIRId: fileName })
                        var json = JSON.stringify(obj);
                        fs.closeSync(fs.openSync(filepath, 'w'));
                        fs.writeFile(filepath, json);
                    }
                }
            }
            returnValue = "Synced File succesfully removed from local folder"
        }
        else {
            returnValue = "This file doesn't exist, cannot fetch";
        }
    }
    else if (operation == "Write") {
        filepath = "pendingCIRs.json";
        if (fs.existsSync(filepath)) {
            try {
                var data = fs.readFileSync(filepath, 'utf8');
                obj = JSON.parse(data);
            } catch (e) {
                console.log('Error:', e.stack);
                returnValue = e.stack;
            }
            if (obj) {
                var cirData = JSON.parse(data);
                obj = cirData;
                obj.table.push({ CIRId: fileName });
                var json = JSON.stringify(obj);
                fs.closeSync(fs.openSync(filepath, 'w'));
                fs.writeFile(filepath, json);
            }
        }
        else {
            obj = { table: [] };
            obj.table.push({ CIRId: fileName });
            var json = JSON.stringify(obj);
            fs.closeSync(fs.openSync(filepath, 'w'));
            fs.writeFile(filepath, json);
        }

        if (!fs.existsSync(fileName)) {
            fs.mkdirSync(fileName);
        }
        for (var i = 0; i < imageData.length; i++) {
            try {
                var imgData = JSON.stringify(imageData[i]);
                var filepath = fileName + "/" + imageData[i].imageId + ".json";
                var fd = fs.openSync(filepath, 'w');
                fs.writeFileSync(fd, imgData);
                fs.closeSync(fd);
                returnValue = "Data saved successfully";
            } catch (e) {
                console.log('Error:', e.stack);
                returnValue = e.stack;
            }
        }
    }
    return returnValue;
}

function GetFilesList(dir, filelist) {
    var fs = fs || require('fs'),
        files = fs.readdirSync(dir);
    // filelist = filelist || [];
    // var path = dir + '/' + files[0];
    // var imgData = JSON.parse(fs.readFileSync(path, 'utf8'));
    // imgData.imageId = files[0].split('.')[0];
    // filelist.push(imgData);
    // return filelist;


    filelist = filelist || [];
    files.forEach(function (file) {
        var path = dir + '/' + file;
        if (fs.existsSync(path)) {
            var imgData = JSON.parse(fs.readFileSync(path, 'utf8'));
            imgData.imageId = file.split('.')[0];
            filelist.push(imgData);
        }
    });
    return filelist;
}
