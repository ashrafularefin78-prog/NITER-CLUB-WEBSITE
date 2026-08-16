$ErrorActionPreference = "Stop"
$base = "C:\Users\user\Downloads\Clubs\.freebuff\docx-work\x"
$x = [IO.File]::ReadAllText("$base\word\document.xml")
Write-Host ("len=" + $x.Length)
$i = $x.IndexOf("13.5"); Write-Host ("13.5 at " + $i)
$j = $x.IndexOf("Appendix"); Write-Host ("Appendix at " + $j)
$v = $x.IndexOf("3.0"); Write-Host ("3.0 at " + $v)
if ($j -gt 0) { Write-Host "--- before Appendix ---"; Write-Host ($x.Substring($j - 700, 700)) }
Write-Host "--- core.xml ---"
$core = [IO.File]::ReadAllText("$base\docProps\core.xml")
Write-Host ($core.Substring(0, [Math]::Min(1200, $core.Length)))
