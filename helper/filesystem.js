const fs = require("fs");
const fsExtra = require("fs-extra");

class FileSystem {
    /**
     * @callback readCallback
     * @param {Object} err - Error output.
     * @param {Array} [files] - Files in directory.
     * @param {String} [dir] - Directory read.
     */
    /**
     * Reads a directory and returns an array of file names.
     * Creates directories that do not exist.
     * Ignores locked files.
     * Ignores archive directories.
     * @param {String} dir - The path of the directory to read.
     * @param {readCallback} callback.
     * @param {Object} [options] - Optional parameters.
     * @param {Boolean} [options.createDir] - Create directory if it does not already exist.
     * @param {(String|Array)} [options.fileExt] - File extensions of files to return.
     */

    static read(dir, callback, options = {}) {
        dir = cleanupDir(dir);

        //first check the listening dir
        fs.readdir(dir, function(err, files) {
            if (err) {
                if (options.createDir) {
                    handleError(err, FileSystem.read, [dir, options.fileExt, callback], 0, callback);
                } else {
                    callback(err);
                }
            } else {
                files = applyFilters(files, options.fileExt);
                callback(null, files, dir);
            }
        });
    };

    /**
     * Reads a directory synchronously and returns an array of file names.
     * @param {String} dir - The path of the directory to read.
     * @param {(String|Array)} [fileExt] - File extensions of files to return.
     */

    static readSync(dir, fileExt) {
        dir = cleanupDir(dir);
        let files = fsExtra.readdirSync(dir);
        return applyFilters(files, fileExt);
    };

    /**
     * @callback readFileCallback
     * @param {Object} err - Error output.
     * @param {Object} [file] - File data.
     */
    /**
     * Reads a particular file and returns the data.
     * @param {String} path - The path of the file to read.
     * @param {readFileCallback} callback.
     * @param {Boolean} [createDir] - Create directory if it does not already exist.
     */

    static readFile(path, callback, createDir) {
        let dir = getDir(path);
        let file = getFile(path);
        fs.readFile(dir + file, function (err, data) {
            if (err) {
                if (createDir) {
                    handleError(err, FileSystem.readFile, [dir, file, callback], 0, callback);
                } else {
                    callback(err);
                }
            } else {
                callback(null, data);
            }
        });
    };

    /**
     * @callback readFileSyncCallback
     * @param {Object} err - Error output.
     * @param {Object} [file] - File data.
     */
    /**
     * Reads a particular file synchronously and returns the data.
     * @param {String} path - The path of the file to read.
     */

    static readFileSync(path) {
        return fs.readFileSync(path);
    };

    /**
     * @callback writeFileCallback
     * @param {Object} err - Error output.
     * @param {Object} [file] - File data.
     */
    /**
     * Reads a particular file and returns the data.
     * @param {String} path - The path of the file to write.
     * @param {Object} data - The data to write to the file.
     * @param {writeFileCallback} callback.
     * @param {Boolean} [createDir] - Create directory if it does not already exist.
     */

    static writeFile(path, data, callback, createDir) {
        let dir = getDir(path);
        let file = getFile(path);
        fs.writeFile(dir + file, data, function (err) {
            if (err) {
                if (createDir) {
                    handleError(err, FileSystem.writeFile, [dir, file, data, callback], 0, callback);
                } else {
                    callback(err);
                }
            } else {
                callback(null, file);
            }
        });
    };

    /**
     * Returns true or false if a path exists
     * @param {String} path - The path to check.
     * @returns {boolean}
     */

    static exists(path) {
        return fsExtra.pathExistsSync(path);
    };

    /**
     * @callback moveCallback
     * @param {Object} err - Error output.
     */
    /**
     * Moves a file
     * @param {String} src - The path of the source file.
     * @param {String} dest - The path to move the file to.
     * @param {moveCallback} callback.
     * @param {Boolean} [createDir] - Create directory if it does not already exist.
     */

    static move(src, dest, callback, createDir) {
        fs.rename(src, dest, function(err) {
            if (err) {
                if (createDir) {
                    handleError(err, FileSystem.move, [src, dest, callback], 1, callback);
                } else {
                    callback(err);
                }
            } else {
                callback(null);
            }
        });
    };

    /**
     * Moves a file synchronously
     * @param {String} src - The path of the source file.
     * @param {String} dest - The path to move the file to.
     * @returns {void}
     */

    static moveSync(src, dest) {
        return fs.renameSync(src, dest);
    };

    /**
     * @callback copyCallback
     * @param {Object} err - Error output.
     */
    /**
     * Copy a file
     * @param {String} src - The path of the source file.
     * @param {String} dest - The path to copy the file to.
     * @param {copyCallback} callback.
     * @param {Boolean} [createDir] - Create directory if it does not already exist.
     */

    static copy(src, dest, callback, createDir) {
        fs.copyFile(src, dest, function(err) {
            if (err) {
                if (createDir) {
                    handleError(err, FileSystem.copy, [src, dest, callback], 1, callback);
                } else {
                    callback(err);
                }
            } else {
                callback(null);
            }
        });
    };

    /**
     * Copy a file synchronously
     * @param {String} src - The path of the source file.
     * @param {String} dest - The path to copy the file to.
     * @returns {Object}
     */

    static copySync(src, dest) {
        return fs.copyFileSync(src, dest);
    };

    /**
     * @callback deleteCallback
     * @param {Object} err - Error output.
     */
    /**
     * Delete a file
     * @param {String} path - The path of the file to delete.
     * @param {deleteCallback} callback.
     */

    static delete(path, callback) {
        fs.unlink(path, function (err) {
            callback(err);
        });
    };

    /**
     * Delete a file synchronously
     * @param {String} path - The path of the file to delete.
     * @returns {Object}
     */

    static deleteSync(path) {
        return fs.unlinkSync(path);
    };

    /**
     * @callback archiveCallback
     * @param {Object} err - Error output.
     * @param {String} [newFile] - New file name.
     * @param {String} [file] - Original file name.
     * @param {String} [dir] - Path of the directory read.
     */
    /**
     * Moves a file into an archive directory and renames the file with a date stamp and status.
     * @param {String} path - The path of the file to archive.
     * @param {String} status - Status to amend to the filename.
     * @param {archiveCallback} callback.
     */

    static archive(path, status, callback) {
        let dir = getDir(path);
        let file = getFile(path);

        const Format = require(appRoot + "app/system/helper/format");
        let date = Format.date();
        let fileDate = date.year + date.month + date.date + date.hours + date.minutes + date.seconds;
        let fileName = file.substring(0, file.lastIndexOf("."));
        let fileExt = file.substring(file.lastIndexOf("."));
        let newFile = fileName + "-" + fileDate + "-" + status + fileExt; //add date and status to end of filename

        if (fileExt === ".locked") {
            fileExt = fileName.substring(fileName.lastIndexOf("."));
            fileName = fileName.substring(0, fileName.lastIndexOf("."));
            newFile = fileName + "-" + fileDate + "-" + status + fileExt; //add date and status to end of filename
        }

        fs.readdir(dir, function(err, files) {
            if (err) {
                callback({message: "Unable to read directory \"" + dir + "\".", err: err});
            } else {
                if (files.indexOf("archive") < 0) { //if no archive directory
                    fs.mkdir(dir + "archive/", function (err) { //create archive directory
                        if (err) {
                            callback({message: "Unable to create directory \"" + dir + "archive/" + "\".", err: err});
                        } else {
                            rename();
                        }
                    });
                } else {    //if archive directory exists
                    rename();
                }
            }
        });

        function rename() {
            fs.rename(dir + file, dir + "archive/" + newFile, function (err) {   //rename file with date
                if (typeof callback === "function") {
                    if (err) {
                        if (err.code === "ENOENT") {    //if file cannot be found, try again with the "locked" extension
                            fs.rename(dir + file + ".locked", dir + "archive/" + newFile, function (err) {   //rename file with date
                                if (typeof callback === "function") {
                                    if (err) {
                                        callback({message: "Unable to archive file \"" + dir + file + "\".", err: err});
                                    } else {
                                        callback(null, newFile, file, dir);
                                    }
                                }
                            });
                        } else {
                            callback({message: "Unable to archive file \"" + dir + file + "\".", err: err});
                        }
                    } else {
                        callback(null, newFile, file, dir);
                    }
                }
            });
        }
    };

    /**
     * @callback lockCallback
     * @param {Object} err - Error output.
     * @param {String} [newFile] - New file name.
     * @param {String} [file] - Original file name.
     * @param {String} [dir] - Path of the directory read.
     */
    /**
     * Locks a file to prevent compatible modules reading that file.
     * @param {String} path - The path of the file to lock.
     * @param {lockCallback} callback.
     */

    static lock(path, callback) {
        let dir = getDir(path);
        let file = getFile(path);

        let fileName = file.substring(0, file.lastIndexOf("."));
        let fileExt = file.substring(file.lastIndexOf("."));
        let newFile = fileName + fileExt + ".locked";   //add the locked suffix

        fs.rename(dir + file, dir + newFile, function (err) {   //rename file with date
            if (typeof callback === "function") {
                if (err) {
                    callback({message: "Unable to lock file \"" + dir + file + "\".", err: err});
                } else {
                    callback(null, newFile, file, dir);
                }
            }
        });
    };

    /**
     * @callback unlockCallback
     * @param {Object} err - Error output.
     * @param {String} [newFile] - New file name.
     * @param {String} [file] - Original file name.
     * @param {String} [dir] - Path of the directory read.
     */
    /**
     * Unlocks a file and restores it to its original filename.
     * @param {String} path - The path of the file to unlock.
     * @param {unlockCallback} callback.
     */

    static unlock(path, callback) {
        let dir = getDir(path);
        let file = getFile(path);

        let newFile = file.substring(0, file.lastIndexOf("."));

        fs.rename(dir + file, dir + newFile, function (err) {   //rename file with date
            if (typeof callback === "function") {
                if (err) {
                    callback({message: "Unable to unlock file \"" + dir + file + "\".", err: err});
                } else {
                    callback(null, newFile, file, dir);
                }
            }
        });
    };

    /**
     * @callback getLatestCallback
     * @param {Object} err - Error output.
     * @param {Array} [file] - Newest file.
     * @param {String} [dir] - Directory read.
     */
    /**
     * Reads a directory and returns the most recently created file.
     * @param {String} dir - The path of the directory to read.
     * @param {getLatestCallback} callback.
     * @param {Array} [fileExt] - File extensions of files to consider.
     */

    static getLatest(dir, callback, fileExt) {
        FileSystem.read(dir, function (err, files) {
            if (err) {
                callback(err);
            } else {
                getEpoch(dir, files, function (err, epoch) {
                    if (err) {
                        callback(err);
                    } else {
                        let newest;
                        for (let e=0; e<epoch.length; e++) {
                            if (newest) {
                                if (newest.epoch > epoch[e].epoch) {
                                    newest = epoch[e];
                                }
                            } else {
                                newest = epoch[e];
                            }
                        }
                        callback(null, newest.file);
                    }
                });
            }
        }, fileExt)
    };

    /**
     * @callback getOldestCallback
     * @param {Object} err - Error output.
     * @param {Array} [file] - Oldest file.
     * @param {String} [dir] - Directory read.
     */
    /**
     * Reads a directory and returns the oldest created file.
     * @param {String} dir - The path of the directory to read.
     * @param {getOldestCallback} callback.
     * @param {(String|Array)} [fileExt] - File extensions of files to consider.
     */

    static getOldest(dir, callback, fileExt) {
        FileSystem.read(dir, function (err, files) {
            if (err) {
                callback(err);
            } else {
                getEpoch(dir, files, function (err, epoch) {
                    if (err) {
                        callback(err);
                    } else {
                        let oldest;
                        for (let e=0; e<epoch.length; e++) {
                            if (oldest) {
                                if (oldest.epoch < epoch[e].epoch) {
                                    oldest = epoch[e];
                                }
                            } else {
                                oldest = epoch[e];
                            }
                        }
                        callback(null, oldest.file);
                    }
                });
            }
        },fileExt)
    };

    /**
     * Reads a file name and returns the file extension.
     * @param {String} file - Filename.
     * @returns {String}.
     */

    static getExt(file) {
        let sections = file.split(".");

        if (sections.includes("locked")) {
            sections.splice(sections.indexOf("locked"), 1); //ignore the "locked" status
        }

        return sections[sections.length-1];
    };

    /**
     * Checks if item is a directory
     * @param {String} item - Item to check.
     * @returns {Boolean}.
     */

    static isDir(item) {
        return fs.lstatSync(item).isDirectory();
    };

    /**
     * Checks if item is a file
     * @param {String} item - Item to check.
     * @returns {Boolean}.
     */

    static isFile(item) {
        return fs.lstatSync(item).isFile();
    };
}

function cleanupDir(dir) {
    if (dir[dir.length-1] !== "/") {
        dir += "/";
    }

    return dir;
}

function applyFilters(files, fileExt) {
    if (files.indexOf("archive") >= 0) {
        files.splice(files.indexOf("archive"), 1);  //remove archive dir from the list
    }

    for (let f=0; f<files.length; f++) {
        //examine file extension
        if (fileExt) {  //if a fileExt has been specified
            let ext = files[f].slice(files[f].lastIndexOf("."));
            ext = ext.toLowerCase();    //set the file extension to lower case

            //look for files that are not the fileExt specified
            if (Array.isArray(fileExt)) {
                let wrongExt = true;
                for (let e=0; e < fileExt.length; e++) {
                    if (ext === "." + fileExt[e].toLowerCase()) {
                        wrongExt = false;
                    }
                }
                if (wrongExt) {
                    files.splice(f, 1);  //remove it from the file list
                    --f;
                }
            } else {
                if (ext !== "." + fileExt.toLowerCase()) {
                    files.splice(f, 1);  //remove it from the file list
                    --f;
                }
            }

            //look for files that are locked
            if (ext === "locked") {
                files.splice(f, 1);  //remove it from the file list
            }
        }
    }

    return files;
}

function getDir(path) {
    let _path = path.split(/[\\|\/]/);
    let dir = "";
    for (let i=0; i<_path.length-1; i++) {
        dir += _path[i] + "/";
    }

    return dir;
}

function getFile(path) {
    let _path = path.split(/[\\|\/]/);

    return _path[_path.length-1];
}

function createDir(dir, callback, i) {
    if (!i) {
        i = 0;
    }
    let dirs = dir.split(("/"));
    let root = "";
    for (let d=0; d<dirs.length-(i+1); d++) {
        root += dirs[d] + "/";
    }

    fs.mkdir(root + dirs[dirs.length-(i+1)], function (err) { //create missing directory
        if (err) {
            if (err.code === "ENOENT") { //error thrown when parent dir does not exist
                //attempt to create full path
                if (i < dirs.length) {
                    createDir(dir, callback, i+1);
                } else {
                    callback();
                }
            } else {
                callback({message: "Unable to create directory \"" + root + dirs[dirs.length-(i+1)] + "\".", err: err});
            }
        } else {
            callback();
        }
    });
}

function getEpoch(dir, files, callback) {
    let epoch = [];

    function getFileEpoch(f) {
        fs.stat(dir + files[f], function(err, stat) {
            if (err) {
                callback(err);
            } else {
                epoch.push({file: files[f], epoch: stat.birthtimeMs});

                if (f+1 < files.length) {
                    getFileEpoch(f+1);
                } else {
                    callback(null, epoch)
                }
            }
        })
    }

    getFileEpoch(0);
}

function handleError(err, fn, args, dirIndex, callback) {
    if (err.code === "ENOENT") {    //if we get an error because the directory does not exist, attempt to create it
        createDir(args[dirIndex], function(err) {
            if (err) {
                callback(err);
            } else {
                fn(args[0], args[1], args[2], args[3], args[4]);
            }
        });
    } else {
        callback(err);
    }
}

module.exports = FileSystem;
