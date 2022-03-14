/**
 * Created by i7 on 19.11.2017.
 */
const c = require('../../backCore.js');
const p = require('path');
const fs = require('fs');
const bundleName = require('./constFe').bundleName;
const { glob } = require('../be/main_global.js');
const { reduced_world } = glob;

function HeaderBase(obj) {
	let basePath = '';
	if (obj.basepath !== undefined) basePath = obj.basepath;
	let res =
		'<meta charset="utf-8">\n' +
		'<meta http-equiv="X-UA-Compatible" content="IE=edge">\n' +
		'<meta name="description" content="">\n' +
		'<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
		'<title>' +
		reduced_world.name +
		'</title>\n' +
		'<!-- Disable tap highlight on IE -->\n' +
		'<meta name="msapplication-tap-highlight" content="no">\n' +
		'<!-- Add to homescreen for Chrome on Android -->\n' +
		'<meta name="mobile-web-app-capable" content="yes">\n' +
		'<meta name="application-name" content="Device">\n' +
		'<!-- Add to homescreen for Safari on iOS -->\n' +
		'<meta name="apple-mobile-web-app-capable" content="yes">\n' +
		'<meta name="apple-mobile-web-app-status-bar-style" content="black">\n' +
		'<meta name="apple-mobile-web-app-title" content="11-parts">\n' +
		'<!-- Tile icon for Win8 (144x144 + tile color) -->\n' +
		'<meta name="msapplication-TileColor" content="#2F3BA2">\n' +
		'<!-- Color the status bar on mobile devices -->\n' +
		'<meta name="theme-color" content="#2F3BA2">\n';

	if (obj.client === 'electron') {
		res += `<script>
            window.nodeRequire = require;
            delete window.require;
            delete window.exports;
            delete window.module;
        </script>\n`;
	}
	//load shared cssS
	obj.world.external_lib.css.forEach((css) => {
		res += `<link rel="stylesheet" href="${basePath}/external/${css}">\n`;
	});

	res += `<link rel="stylesheet" href="/compiled/${bundleName}.css">\n`;

	let flp;

	let region = obj.world.regions[obj.PageRegionName];
	if (obj.PageRegionName === '' || !region.clone) {
		flp = c.FW_PATH + '/ui/styles/' + obj.PageRegionName;
	} else {
		flp = c.FW_PATH + '/ui/styles/' + region.clone;
	}

	if (obj.PageRegionName) {
		fs.readdirSync(flp).forEach(function (file) {
			if (p.extname(file).toLowerCase() === '.css')
				res += `<link rel="stylesheet" href="${basePath}/styles/${obj.PageRegionName}/${file}">\n`;
		});
	} else {
		fs.readdirSync(c.FW_PATH + '/ui/styles/').forEach(function (file) {
			if (p.extname(file).toLowerCase() === '.css')
				res += `<link rel="stylesheet" href="${basePath}/styles/${file}">\n`;
		});
	}

	return res;
}

function AddJSLib(obj) {
	let res = '';
	let basePath = '';
	if (obj.basepath !== undefined) basePath = obj.basepath;

	obj.world.external_lib.js.forEach((js) => {
		res += `<script src="${basePath}/external/${js}"></script>\n`;
	});

	return res;
}

function GenHeader(obj) {
	return (
		'<!DOCTYPE html>\n' +
		'<html lang="">\n' +
		'<head><base href="./"/>' +
		HeaderBase(obj) +
		'</head>\n<body>\n' +
		AddJSLib(obj) +
		`<script src="/compiled/${bundleName}.js"></script>\n`
	);
}

function GenHeadWait(obj) {
	return (
		'<!DOCTYPE html>\n<html lang="">\n<head>\n' +
		HeaderBase(obj) +
		'</head><body>\n' +
		AddJSLib(obj)
	);
}

module.exports = {
	GenHeader,
	GenHeadWait
};
