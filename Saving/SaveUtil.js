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
