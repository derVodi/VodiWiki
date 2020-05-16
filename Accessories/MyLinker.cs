using System;
using System.Diagnostics;
using System.IO;
using System.Reflection;

[assembly:AssemblyVersionAttribute(MyLinker.Version)]
public class MyLinker {

	public const string Version = "0.0.2";

	private static bool _WithinJsBlock;

	private static bool _SkippingContent;

	private static bool _MinifiedDirIsClean;

	private static string[] _Args;

	// arg[0] - Flags        - -minify-
	// arg[1] - source.html  - Wiki containing    content,       no JS (for developing)
	// arg[2] - target1.html - Wiki containing no content, embedded JS (empty wiki for download and update)
	// arg[3] - target2.html - Wiki containing    content, embedded JS (wiki for homepage)
	public static void Main(string[] args) {
		_Args = args;
		Console.WriteLine("MyLinker " + Version);
		using (StreamWriter emptyWikiWriter = new StreamWriter(args[2])) {
			emptyWikiWriter.NewLine = "\n";
			using (StreamWriter fullWikiWriter = new StreamWriter(args[3])) {
				fullWikiWriter.NewLine = "\n";
				CopyLineByLine(args[1], emptyWikiWriter, fullWikiWriter, ProcessLine);
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
			Console.Write("\"" + jsPath + "\" ");
			if(_Args[0].IndexOf("-minify-") > -1 ){
				Console.Write("Minifying ... ");
				jsPath = Minify(jsPath, ! _MinifiedDirIsClean);
				_MinifiedDirIsClean = true;
			}
			Console.Write("Embedding ... ");
			CopyLineByLine(
				jsPath,
				emptyWikiWriter,
				fullWikiWriter,
				delegate (string l, StreamWriter ew,  StreamWriter fw) {
					return (string.IsNullOrWhiteSpace(l) ? null : l); // omit blank lines
				}
			);
			Console.WriteLine("Done.");
			return null;
		}

		if (line.IndexOf("<div id=\"storeArea\">") > -1) _SkippingContent = true;

		return line;
	}

	public static string Minify(string sourceFileFullName, bool cleanupBefore){
		string miniOutDir = Path.Combine("Out", "Minified");
		if (cleanupBefore && Directory.Exists(miniOutDir)) Directory.Delete(miniOutDir, true);
		string destinationFileFullName = Path.Combine(miniOutDir, Path.GetDirectoryName(sourceFileFullName).Replace("/", ".") + "." + Path.GetFileName(sourceFileFullName));
		string parameters = "-o \"" + destinationFileFullName + "\" \"" + sourceFileFullName + "\"";
		// Console.WriteLine(parameters);
		ProcessStartInfo info = new System.Diagnostics.ProcessStartInfo("minify.exe", parameters);
		Process p = new System.Diagnostics.Process();
		p.StartInfo = info;
		p.Start();
		p.WaitForExit();
		return destinationFileFullName;
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
