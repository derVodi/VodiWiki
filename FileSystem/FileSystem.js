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
