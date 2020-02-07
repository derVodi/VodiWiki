function onImageNodePasted(node, target){	
	requesAsync("blob", node.src, function(response, contentType){ 
		var title = blobToNewArticle(response, function(title, article){ insertAtCursor(target, "[img[" + title + "]]"); });
	});
}

var pasteHandlers = { // TagName: Delegate
	IMG: onImageNodePasted
};

function onPasted(e){ // this = textarea, e = ClipBoardEvent
	var items = e.clipboardData.items;
	var target = e.target;
	var wasHandled;
	for (var i = 0; i < items.length; i++) {
		var item = items[i];
		
		switch (true) {
			case (item.type == "text/html"):{
				item.getAsString(
					function(s){						
						processHtmlSourceAsDocument(s, function(doc){
							recurseDom(doc.childNodes, function(node) { if (pasteHandlers[node.nodeName]) pasteHandlers[node.nodeName](node, target); });
						});
					}
				)
				wasHandled = true;
				break;
			}
			case (item.type == "text/plain"):{
				item.getAsString(function(s){ console.log("text/plain:"+s); });
				wasHandled = true;
				break;
			}
			case (item.type.indexOf("image") > -1): {
				var blob = item.getAsFile();
				var title = blobToNewArticle(blob, function(title, article){ insertAtCursor(target, "[img[" + title + "]]"); });
				wasHandled = true;
				break;
			}			
		}
		if (wasHandled) break;
	}
}
