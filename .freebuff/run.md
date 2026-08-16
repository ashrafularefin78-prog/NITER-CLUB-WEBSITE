# Running this workspace

This is a **static single-file site** (`index.html` at the repo root, plus `firebase/` config and `web/public/images/` assets). There is no Node/Python runtime on this machine, so the preview uses a tiny PowerShell static file server.

## Reproduce the artifacts
- No build step and no env files to copy: `index.html` reads the Firebase config inline (CDN) and works fully offline from `localStorage`.
- Nothing to install.

## Run the server
Start the PowerShell static server detached (port 5173):

```powershell
powershell -NoProfile -Command "(Start-Process -FilePath 'powershell.exe' -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-File','C:\Users\user\Downloads\Clubs\.freebuff\serve.ps1','C:\Users\user\Downloads\Clubs','5173' -RedirectStandardOutput 'C:\Users\user\Downloads\Clubs\.freebuff\preview.log' -RedirectStandardError 'C:\Users\user\Downloads\Clubs\.freebuff\preview.log.err' -WindowStyle Hidden -PassThru).Id"
```

Notes:
- The server script is `.freebuff/serve.ps1` (a minimal `HttpListener` file server with MIME types).
- The port shows as owned by PID 4 (System) in `netstat` because `HttpListener` binds through http.sys; the real process is the powershell running `serve.ps1` (find it via `Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*serve.ps1*' }`).
- Verify it answers: `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5173/` → `200`.
