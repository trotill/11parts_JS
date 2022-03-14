function rmBackPath(path) {
	return path.replace(/[A-Za-z0-9]+\/\.\.\//g, '');
}

module.exports = {
	rmBackPath
};
