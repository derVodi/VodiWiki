using System;
using System.IO;

public class MyLinker {

	private static bool _WithinJsBlock;
	private static bool _SkippingContent;

	// arg[0] - source.html  - Wiki containing    content,       no JS (for developing)
	// arg[1] - target1.html - Wiki containing no content, embedded JS (empty wiki for download and update)
	// arg[2] - target2.html - Wiki containing    content, embedded JS (wiki for homepage)
	public static void Main(string[] args) {

		using (StreamWriter emptyWikiWriter = new StreamWriter(args[1])) {
			using (StreamWriter fullWikiWriter = new StreamWriter(args[2])) {
				emptyWikiWriter.NewLine = "\n";
				CopyLineByLine(args[0], emptyWikiWriter, fullWikiWriter, ProcessLine);
			}
		}
	}

	public static string ProcessLine(string line, StreamWriter emptyWikiWriter, StreamWriter fullWikiWriter){
		
		if (line.IndexOf("<!--POST-STOREAREA-->") > -1){
			emptyWikiWriter.WriteLine("</div>");
			_SkippingContent = false;
			return line;
		}

		if (_SkippingContent) {
			fullWikiWriter.WriteLine(line);
			return null;
		}

		if (line.IndexOf("<!--JS-START-->") > -1) {
			if (_WithinJsBlock) Console.WriteLine("ERROR JS-START cannot be nested!");
			_WithinJsBlock = true;			
			return ("<script id=\"jsSection\">");
		}

		if (line.IndexOf("<!--JS-END-->") > -1){
			if (! _WithinJsBlock) Console.WriteLine("ERROR closing JS-START was never opened!");
			_WithinJsBlock = false;			
			return "</script>";
		}

		if (line.IndexOf("<script src=") > -1){ // embed external .js references
			string jsPath = line.Substring(13, line.IndexOf("\"", 13) - 13);
			CopyLineByLine(
				jsPath,
				emptyWikiWriter,
				fullWikiWriter,
				delegate (string l, StreamWriter ew,  StreamWriter fw) {
					return (string.IsNullOrWhiteSpace(l) ? null : l); // omit blank lines
				}
			);			
			return null;
		}

		if (line.IndexOf("<div id=\"storeArea\">") > -1) _SkippingContent = true;

		return line;
	}

	public static void CopyLineByLine(string sourceFileName, StreamWriter emptyWikiWriter, StreamWriter fullWikiWriter, Func<string, StreamWriter, StreamWriter, string> onLineRead){
		using (StreamReader reader = new StreamReader(sourceFileName)) {
			string line;
			while ((line = reader.ReadLine()) != null) {
				string processedLine = onLineRead.Invoke(line, emptyWikiWriter, fullWikiWriter);
				if (processedLine != null){
					emptyWikiWriter.WriteLine(processedLine);
					fullWikiWriter.WriteLine(processedLine);
				} 
			}
		}
	}

}
