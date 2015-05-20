var through = require('through2');
var gutil = require('gulp-util');
var path = require('path');
var fs = require('fs');
var mime = require('mime');

module.exports = function (searchPaths) {
    if (!Array.isArray(searchPaths)) {
        searchPaths = [searchPaths];
    }

    function base64Inline (file, enc, callback) {
        // Do nothing if no contents
        if (file.isNull()) {
            this.push(file);
            return callback();
        }

        // Accepting streams is prohibited
        if (file.isStream()) {
            this.emit('error', new gutil.PluginError('gulp-inline-base64', 'Stream content is not supported'));
            return callback();
        }

        function normalizePath (imagePath) {
            var searchPath;

            if (!searchPaths) {
                searchPath = path.dirname(file.path);
            } else {
                searchPath = path.join(path.dirname(file.path), searchPaths);
                if (path.resolve(searchPaths) === path.normalize(searchPaths)) {
                    searchPath = searchPaths;
                }
            }

            return path.join(searchPath, imagePath);
        }

        function inline (inlineExpr, quotedPath) {
            var imagePath = quotedPath.replace(/'"/, '');

            var fileData, fileBase64, fileMime;

            searchPaths.forEach(function(searchPath) {
                if (fileData) return;
                try {
                    fileData = fs.readFileSync(normalizePath(imagePath));
                    fileBase64 = new Buffer(fileData).toString('base64');
                    fileMime = mime.lookup(normalizePath(imagePath));
                }
                catch (e) {}
            });

            if (!fileData) return inlineExpr;

            return 'url(data:' + fileMime  + ';base64,' + fileBase64 + ')';
        }

        // Check if file.contents is a `Buffer`
        if (file.isBuffer()) {
            var base64 = String(file.contents).replace(/inline\((.+)\)/g, inline);
            file.contents = new Buffer(base64);

            this.push(file);
        }

        return callback();
    }

    return through.obj(base64Inline);
};
