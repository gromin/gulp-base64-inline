var through = require('through2');
var gutil = require('gulp-util');
var path = require('path');
var fs = require('fs');
var mime = require('mime');

function expandPath(file, givenPath) {
    var searchPath;

    if (!givenPath) {
        searchPath = path.dirname(file.path);
    } else {
        if (path.resolve(givenPath) === path.normalize(givenPath)) {
            searchPath = givenPath;
        }
        else {
            searchPath = path.join(path.dirname(file.path), givenPath);
        }
    }

    console.log(givenPath)
    return searchPath;
}

module.exports = function (givenPaths) {

    givenPaths = Array.isArray(givenPaths) ? givenPaths : [givenPaths];

    function base64Inline (file, enc, callback) {
        var imagesPath;

        // Do nothing if no contents
        if (file.isNull()) {
            this.push(file);
            return callback();
        }

        if (file.isStream()) {
            // accepting streams is optional
            this.emit('error', new gutil.PluginError('gulp-inline-base64', 'Stream content is not supported'));
            return callback();
        }

        function inline (inlineExpr, quotedInlinePath) {
            var inlinePath = quotedInlinePath.replace(/[\'\"]/g, '');
            var fileMime = mime.lookup(inlinePath);
            var prefix = 'url(data:' + fileMime  + ';base64,';
            var fileData;
            var res;

            givenPaths.forEach(function(givenPath) {
                givenPath = expandPath(file, givenPath);
                try {
                    fileData = fs.readFileSync(path.join(givenPath, inlinePath));
                }
                catch (e) {
                    console.log('not found: '+inlinePath);
                    return;
                }
                // console.log('found: '+inlinePath);
                res = prefix + new Buffer(fileData).toString('base64') + ')';
            });

            if (res) {
                return res;
            }
            else {
                return 'inline('+inlinePath+')';
            }
        }

        // check if file.contents is a `Buffer`
        if (file.isBuffer()) {
            var base64 = String(file.contents).replace(/inline\(([^\)]+)\)/g, inline);
            file.contents = new Buffer(base64);

            this.push(file);
        }

        return callback();
    }

    return through.obj(base64Inline);
};
