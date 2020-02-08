// Returns true, if saving was possible unattendedly (without forcing the user to download manually)
window.saveFile = window.saveFile || function(fileUrl, htmlSource, forceManualMode) {
	
	if (! forceManualMode) if (saveFileViaBlobApi(fileUrl, htmlSource)) return true;
		
	// Fallback: Create data URL link for manual download
		
	var dataUrl = "data:text/html;charset=UTF-8;base64," + encodeBase64(unescape(encodeURIComponent(htmlSource)));
	// JavaScript strings are UTF-16.
	// encodeURIComponent() will re-encode the UTF-16 string to UTF-8, but unfortunalely escape all URL-poison-chars/spaces
	// after calling unescape() you get pure UTF-8
	
	displayMessage(config.messages.mainDownloadManual, dataUrl, -1);		
	return false;
}

function saveFileViaBlobApi(fileUrl, htmlSource) {	
	if (document.createElement("a").download == undefined) return null;
	try {
		
		var slashpos = fileUrl.lastIndexOf("/");
		if (slashpos == -1) slashpos = fileUrl.lastIndexOf("\\"); 
		var filename = fileUrl.substr(slashpos + 1);
		
		var blob = new Blob([htmlSource], {encoding: "UTF-8", type: "data:text/html; charset=UTF-8"});
		var uri = window.URL.createObjectURL(blob);
		
		var link = document.createElement("a");
		// link.setAttribute("target", "_blank");
		link.setAttribute("href", uri);
		link.setAttribute("download", filename);
		document.body.appendChild(link);		
		link.click();
		document.body.removeChild(link);
		// window.URL.revokeObjectURL(uri); // todo: normally this should be done - edge won't save with this - maybe a timing problem, solution could be using a callback (if possible)
	} catch(ex) {
		return false;
	}	
	return true;
}

function saveTest() {
	var s = document.getElementById("saveTest");
	if (s.hasChildNodes()) alert(config.messages.savedSnapshotError);
	s.appendChild(document.createTextNode("savetest"));
}
