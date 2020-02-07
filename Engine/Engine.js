// Called on unload. All functions called conditionally since they themselves may have been unloaded.
function unload() {
	if (window.checkUnsavedChanges) checkUnsavedChanges();
	if (window.scrubNodes) scrubNodes(document.body);
}

function restart() {
	invokeParamifier(params, "onstart");
	if (story.isEmpty()) {
		story.showArticle(firstLeaf);
	}
	window.scrollTo(0, 0);
}

//--
//-- Utility functions
//--

// Returns version string
function formatVersion(v) {
	v = v || version;
	return v.major + "." + v.minor + "." + v.revision;
}

function compareVersions(v1, v2) {
	var x1, x2, i, a = ["major", "minor", "revision"];
	for (i = 0; i < a.length; i++) {
		x1 = v1[a[i]] || 0;
		x2 = v2[a[i]] || 0;
		if (x1<x2) return 1;
		if (x1 > x2) return -1;
	}
	x1 = v1.beta || 9999;
	x2 = v2.beta || 9999;
	if (x1 < x2) return 1;
	return x1 > x2 ? -1 : 0;
}

function merge(dst, src, preserveExisting) {
	var i;
	for (i in src) {
		if (! preserveExisting || dst[i] === undefined) dst[i] = src[i];
	}
	return dst;
}
