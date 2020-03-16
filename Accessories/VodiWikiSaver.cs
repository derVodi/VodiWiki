using System;
using System.IO;
using System.Windows.Forms;
using System.Drawing;
using System.Reflection;
using System.Net;
using System.Threading;
using System.Text;
using System.Web;

[assembly:AssemblyVersionAttribute(VodiWikiSaver.Version)]
[assembly:AssemblyProduct(VodiWikiSaver.Product)]
public class VodiWikiSaver {

	public const string Version = "1.0.13";

	public const string Product = "VodiWikiSaver";

	public const string MiddlePart = "/VodiWikiSaver/";

	public const string UrlPrefix = "http://localhost:8080" + MiddlePart;

 	private static System.Threading.Mutex _Mutex = new System.Threading.Mutex(true, "VodiWikiSaver");

	private static NotifyIcon _TrayIcon;

	private static WebServer _WebServer;

	[STAThread]
	public static void Main(string[] args) {

		try {

			if (! _Mutex.WaitOne(0, false)) {
				_Mutex.Close();
				MessageBox.Show("Another instance is already running!", VodiWikiSaver.Product);
        return;
      }

			MenuItem item = new MenuItem() {Text = "&Exit"};
			item.Click += new System.EventHandler(Exit_Clicked);
			ContextMenu menu = new ContextMenu();
			menu.MenuItems.Add(item);

			_TrayIcon = new NotifyIcon() {
				Icon = new Icon(Assembly.GetExecutingAssembly().GetManifestResourceStream(null, "VodiWikiSaver.ico")),
				Text = "Vodi Wiki Saver " + Version,
				ContextMenu = menu,
				Visible = true
			};

			_WebServer = new WebServer(HttpRequest_Recieved);
			_WebServer.Run();

			Application.Run();
		}
		catch(Exception e) {
			MessageBox.Show(e.ToString(), VodiWikiSaver.Product);
		}
	}

	private static void Exit_Clicked(Object sender, EventArgs e){
		_TrayIcon.Dispose();
		_Mutex.ReleaseMutex();
		_WebServer.Stop();
 		Application.Exit();
	}

	private static string HttpRequest_Recieved(HttpListenerRequest request){

		Stream body = request.InputStream;
		StreamReader reader = new StreamReader(body, request.ContentEncoding);
		string completeContentString = reader.ReadToEnd();
		body.Close();
    reader.Close();

		string partBeforeQuery = request.Url.AbsolutePath.Substring(MiddlePart.Length);

		if (partBeforeQuery[0] != Version[0]){
			return "ERROR: Request from Wiki-Version " + partBeforeQuery[0] + ".x.x cannot be handled by VodiWikiSaver " + Version[0] + ".x.x!";
		}

		string targetFileFullName = HttpUtility.UrlDecode(request.Url.Query);
		targetFileFullName = targetFileFullName.Substring(targetFileFullName.IndexOf("///") + 3);

		// MessageBox.Show(targetFileFullName);

		string tempFileFullName = targetFileFullName + ".saving";
		System.IO.File.WriteAllText(tempFileFullName, completeContentString, Encoding.UTF8);

		FileInfo fi = new FileInfo(tempFileFullName);
		if (fi.Length == 0){
			return "ERROR: Writing to file failed: " + Path.GetFileName(targetFileFullName);
		}

		File.Delete(targetFileFullName);
		File.Move(tempFileFullName, targetFileFullName);

		SetTrayText(DateTime.Now.ToString() + Environment.NewLine + Path.GetFileName(targetFileFullName));

		return "OK";
	}

	private static void SetTrayText(string text){
		if (text.Length > 64) text = text.Substring(0, 64);
		_TrayIcon.Text = text;
	}

}

public class WebServer {

	private readonly HttpListener _Listener = new HttpListener();

	private readonly Func<HttpListenerRequest, string> _OnRequestRecievedMethod;

	public WebServer(Func<HttpListenerRequest, string> onRequestRecievedMethod){
		_Listener.Prefixes.Add(VodiWikiSaver.UrlPrefix);
		_OnRequestRecievedMethod = onRequestRecievedMethod;
		_Listener.Start();
	}

	public void Run(){
		ThreadPool.QueueUserWorkItem(o => {
			try	{
				string responseString;
				while (_Listener.IsListening) {
					ThreadPool.QueueUserWorkItem(c => {
						HttpListenerContext ctx = c as HttpListenerContext;
						try {
							if (ctx == null) {
								return;
							}
							string origin = ctx.Request.Headers.Get("Origin");
							if (origin != null && origin.ToLower() != "null" && origin.ToLower() != "file://"){ // "file://" is Microsoft Edge specific :-/
								ctx.Response.Abort(); // block non-local JS requests (server side)
								return;
							}
							responseString = _OnRequestRecievedMethod(ctx.Request);
							ctx.Response.AppendHeader("Content-Type", "text/plain");
							ctx.Response.AppendHeader("Access-Control-Allow-Origin", origin); // block non-local JS requests (browser)
							byte[] buf = Encoding.UTF8.GetBytes(responseString);
							ctx.Response.ContentLength64 = buf.Length;
							ctx.Response.OutputStream.Write(buf, 0, buf.Length);
						}
						catch(Exception ex)	{
							responseString = "ERROR: " + ex.ToString();
						}
						finally {
							// always close the stream
							if (ctx != null) {
								ctx.Response.OutputStream.Close();
							}
						}
						if (responseString.StartsWith("ERROR:")) MessageBox.Show(responseString, VodiWikiSaver.Product);
					}, _Listener.GetContext()); // Note: The GetContext method blocks while waiting for a request.
				}
			}
			catch {
				// ignored
			}
		});
	}

	public void Stop() {
		_Listener.Stop();
		_Listener.Close();
	}
}
