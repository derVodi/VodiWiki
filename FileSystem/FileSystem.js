function getFileName(url, withoutExtension){
	
	var fileName, p;
	if ((p = url.lastIndexOf("/")) != -1)
		fileName = url.substr(p + 1);
	else if ((p = url.lastIndexOf("\\")) != -1)
		fileName = url.substr(p + 2);
	else
		fileName = url;
	
	if (withoutExtension){
		if ((p = fileName.lastIndexOf(".")) != -1) fileName = fileName.substr(0, p);
	}
	return fileName;
}

// Translate URL to local path [Preemption]
// e.g. "file:///C:/Foo/Bar/Batz.html" =>
//              "C:\\Foo\\Bar\\Batz.html"
window.getLocalPath = window.getLocalPath || function(uri) {	
	// Remove any location or query part of the URL
	var argPos = uri.indexOf("?");
	if (argPos != -1) uri = uri.substr(0, argPos);
	var hashPos = uri.indexOf("#");
	if (hashPos != -1) uri = uri.substr(0, hashPos);	
	if (uri.indexOf("file://localhost/") == 0) uri = "file://" + uri.substr(16); // Convert file://localhost/ to file:///
	// Convert to a native file format
	var localPath;
	if (uri.charAt(9) == ":") // pc local file
		localPath = uri.substr(8).replace(new RegExp("/","g"),"\\");
	else if (uri.indexOf("file://///") == 0) // FireFox pc network file
		localPath = "\\\\" + uri.substr(10).replace(new RegExp("/","g"),"\\");
	else if (uri.indexOf("file:///") == 0) // mac/unix local file
		localPath = uri.substr(7);
	else if (uri.indexOf("file:/") == 0) // mac/unix local file
		localPath = uri.substr(5);
	else // pc network file
		localPath = "\\\\" + uri.substr(7).replace(new RegExp("/","g"),"\\");
				
	return localPath;
}

function localAjax(ajaxParameters) {
	var onLoadMethod = function(fileContent) { ajaxParameters.success(fileContent, "success", { responseText: fileContent }); } 
	// first fileContent argument is only there for spec reasons, but never consumed. responseText is.
	
	var onErrorMethod = function(who) { ajaxParameters.error({ message: who + ": cannot read local file" }, "error", 0); }

	if (ajaxParameters.file) try {
		var reader = new FileReader();
		reader.onload = function(e)  { onLoadMethod(e.target.result); } // "target" is actually "sender" - here: the FileReader instance
		reader.onerror = function(e) { onErrorMethod("FileReader"); }
		reader.readAsText(ajaxParameters.file); // ASYNC
		return true;
	} catch (ex) { ; }

	onErrorMethod("loadFile");
	return true;
}
