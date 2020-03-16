CLS
@ECHO OFF

TASKKILL >NUL /IM VodiWikiSaver.exe /F /FI "STATUS eq RUNNING"

"C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe" /resource:VodiWikiSaver.ico /target:winexe /nologo /out:..\Out\VodiWikiSaver.exe VodiWikiSaver.cs

IF NOT %ERRORLEVEL% == 0 GOTO :End

START ..\Out\VodiWikiSaver.exe

ECHO [%time%] Success: VodiWikiSaver built and restarted.

:End
