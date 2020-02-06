using System;
using System.IO;

public class MyLinker {

	private static string _CurrentNamespace;
	private static bool _SkippingBlock;

	// arg[0] - source.html
	// arg[1] - target.html
	public static void Main(string[] args) {

		// Console.WriteLine(args[0]);
		// Console.WriteLine(args[1]);

		using (StreamWriter writer = new StreamWriter(args[1])) {
			writer.NewLine = "\n";
			CopyLineByLine(args[0], writer, ProcessLine);		
		}
	}

	public static bool ProcessLine(string line, StreamWriter writer){
		
		if (line.IndexOf("<!--POST-STOREAREA-->") > -1){
			writer.WriteLine("</div>");
			_SkippingBlock = false;
			return true;
		}

		if (_SkippingBlock) return false;
		
		if (line.IndexOf("<!-- Begin Namespace") > -1) {
			string n = line.Substring(21, line.IndexOf(" ", 21) - 21);
			if (_CurrentNamespace != null) Console.WriteLine("ERROR opened namespace was not closed");
			_CurrentNamespace = n;
			writer.WriteLine(String.Format("<script id=\"js{0}\">", n));
			return false;
		}

		if (line.IndexOf("<!-- End Namespace") > -1){
			if (_CurrentNamespace == null) Console.WriteLine("ERROR closing namespace was never opened");
			_CurrentNamespace = null;
			writer.WriteLine("</script>");
			return false;
		}

		if (line.IndexOf("<script src=") > -1){ // embed external .js references
			string jsPath = line.Substring(13, line.IndexOf("\"", 13) - 13);
			CopyLineByLine(
				jsPath,
				writer, 
				delegate (string l, StreamWriter w) {
					return (! string.IsNullOrWhiteSpace(l)); // omit blank lines
				}
			);			
			return false;
		}

		if (line.IndexOf("<div id=\"storeArea\">") > -1) _SkippingBlock = true;

		return true;
	}

	public static void CopyLineByLine(string sourceFileName, StreamWriter writer, Func<string, StreamWriter, bool> onLineRead){
		using (StreamReader reader = new StreamReader(sourceFileName)) {
			string line;
			while ((line = reader.ReadLine()) != null) {
				bool passThrough = onLineRead.Invoke(line, writer);
				if (passThrough) writer.WriteLine(line);
			}
		}
	}

}
