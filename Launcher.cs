using System;
using System.Diagnostics;
using System.IO;
using System.Net.Sockets;
using System.Threading;
using System.Windows.Forms;

namespace MDViewerLauncher
{
    class Program
    {
        static string logFile;

        static void Log(string msg)
        {
            try
            {
                File.AppendAllText(logFile, string.Format("[{0:HH:mm:ss.fff}] {1}\r\n", DateTime.Now, msg));
            }
            catch { }
        }

        static bool IsPortListening(string host, int port)
        {
            try
            {
                using (TcpClient client = new TcpClient())
                {
                    IAsyncResult result = client.BeginConnect(host, port, null, null);
                    bool success = result.AsyncWaitHandle.WaitOne(200);
                    if (!success) return false;
                    client.EndConnect(result);
                    return true;
                }
            }
            catch
            {
                return false;
            }
        }

        static string FindNodeExe()
        {
            // 1. Program Files
            string pf = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "nodejs", "node.exe");
            if (File.Exists(pf)) return pf;

            // 2. Program Files (x86)
            string pfx86 = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), "nodejs", "node.exe");
            if (File.Exists(pfx86)) return pfx86;

            // 3. Search PATH
            string pathEnv = Environment.GetEnvironmentVariable("PATH");
            if (!string.IsNullOrEmpty(pathEnv))
            {
                foreach (string rawDir in pathEnv.Split(';'))
                {
                    string dir = rawDir.Trim().Trim('"');
                    if (string.IsNullOrEmpty(dir)) continue;
                    try
                    {
                        string full = Path.Combine(dir, "node.exe");
                        if (File.Exists(full)) return full;
                    }
                    catch { }
                }
            }

            return "node.exe";
        }

        [STAThread]
        static void Main(string[] args)
        {
            string appDir = AppDomain.CurrentDomain.BaseDirectory;
            logFile = Path.Combine(appDir, "mdviewer.log");
            Log("=== MDViewer Started ===");
            Log("Args: " + string.Join(" ", args));

            try
            {
                string serverScript = Path.Combine(appDir, "server.js");

                if (!File.Exists(serverScript))
                {
                    Log("server.js bulunamadi: " + serverScript);
                    MessageBox.Show("server.js bulunamadı:\n" + serverScript, "Markdown Viewer", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    return;
                }

                string targetFile = args.Length > 0 ? args[0] : "";
                int port = 3000;
                string host = "127.0.0.1";

                bool isRunning = IsPortListening(host, port);
                Log("Server isRunning: " + isRunning);

                if (!isRunning)
                {
                    string nodePath = FindNodeExe();
                    Log("Found nodePath: " + nodePath);

                    ProcessStartInfo nodePsi = new ProcessStartInfo();
                    nodePsi.FileName = nodePath;
                    nodePsi.Arguments = string.Format("\"{0}\" --no-open", serverScript);
                    nodePsi.WorkingDirectory = appDir;
                    nodePsi.WindowStyle = ProcessWindowStyle.Hidden;
                    nodePsi.UseShellExecute = true;

                    Process nodeProc = Process.Start(nodePsi);
                    Log("Started node process PID: " + (nodeProc != null ? nodeProc.Id.ToString() : "null"));

                    // Sunucunun ayağa kalkmasını bekle (en fazla 4 saniye)
                    for (int i = 0; i < 40; i++)
                    {
                        Thread.Sleep(100);
                        if (IsPortListening(host, port))
                        {
                            isRunning = true;
                            Log("Server became ready after " + ((i + 1) * 100) + "ms");
                            break;
                        }
                    }

                    if (!isRunning)
                    {
                        Log("Server failed to listen on port 3000 within timeout!");
                    }
                }

                // Tarayıcıyı doğrudan Windows Shell üzerinden aç
                string openUrl = "http://" + host + ":" + port + "/";
                if (!string.IsNullOrEmpty(targetFile))
                {
                    string fullPath = Path.GetFullPath(targetFile);
                    openUrl += "?file=" + Uri.EscapeDataString(fullPath);
                }

                Log("Opening browser URL: " + openUrl);

                ProcessStartInfo browserPsi = new ProcessStartInfo();
                browserPsi.FileName = openUrl;
                browserPsi.UseShellExecute = true;
                Process.Start(browserPsi);
                Log("Browser launched successfully. MDViewer done.");
            }
            catch (Exception ex)
            {
                Log("FATAL EXCEPTION: " + ex.ToString());
                MessageBox.Show(
                    "Markdown Viewer başlatılırken hata oluştu:\n" + ex.Message,
                    "Markdown Viewer",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
            }
        }
    }
}
