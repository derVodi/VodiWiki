using System;
using System.Windows.Forms;
using System.Drawing;
using System.Reflection;

// To compile this, use:
// "command": "\"C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe\" /resource:Accessories\\VodiWikiSaver.ico /target:winexe /nologo /out:Accessories\\VodiWikiSaver.exe Accessories\\VodiWikiSaver.cs"

[assembly:AssemblyVersionAttribute(VodiWikiSaver.Version)]
public class VodiWikiSaver {

	public const string Version = "1.0.0";

 	private static System.Threading.Mutex _Mutex = new System.Threading.Mutex(true, "VodiWikiSaver");

	private static NotifyIcon _TrayIcon;

	private static Timer _Timer = new Timer() {Interval = 5000};

	[STAThread]
	public static void Main(string[] args) {

		try {
 		
			if (! _Mutex.WaitOne(0, false)) {
				_Mutex.Close();
				MessageBox.Show("Another instance is already running!");
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
		
			_Timer.Tick += new EventHandler(Timer_Ticked);
			_Timer.Start();
			Application.Run();
		}
		catch(Exception e) {
			MessageBox.Show(e.ToString());
		}		
	}

	private static void Exit_Clicked(Object sender, EventArgs e){
		_TrayIcon.Dispose();
		_Mutex.ReleaseMutex();
 		Application.Exit();
	}

	private static void Timer_Ticked(Object sender, EventArgs e){
		try {
			_Timer.Stop();
			// TODO poll the download dir		
		}
		catch(Exception ex) {
			MessageBox.Show(ex.ToString());
		}
		_Timer.Start();
	}

}
