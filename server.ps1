param([int]$Port = 8765)
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:$Port/")
try { $listener.Start() } catch { Write-Host "Impossibile avviare il server: $($_.Exception.Message)"; Read-Host "Premi Invio"; exit 1 }
Write-Host "Genova mApp - 360 Lab"
Write-Host "Server offline: http://127.0.0.1:$Port/"
Write-Host "Chiudi questa finestra per arrestarlo."
$mime = @{'.html'='text/html; charset=utf-8';'.css'='text/css; charset=utf-8';'.js'='application/javascript; charset=utf-8';'.svg'='image/svg+xml';'.jpg'='image/jpeg';'.jpeg'='image/jpeg';'.png'='image/png';'.webp'='image/webp';'.mp4'='video/mp4';'.webm'='video/webm';'.json'='application/json; charset=utf-8';'.txt'='text/plain; charset=utf-8'}
while ($listener.IsListening) {
  try {
    $ctx = $listener.GetContext(); $req=$ctx.Request; $res=$ctx.Response
    $rel=[Uri]::UnescapeDataString($req.Url.AbsolutePath.TrimStart('/'))
    if([string]::IsNullOrWhiteSpace($rel)){ $rel='index.html' }
    $path=[IO.Path]::GetFullPath((Join-Path $root $rel.Replace('/',[IO.Path]::DirectorySeparatorChar)))
    if(-not $path.StartsWith([IO.Path]::GetFullPath($root)) -or -not (Test-Path -LiteralPath $path -PathType Leaf)){ $res.StatusCode=404; $bytes=[Text.Encoding]::UTF8.GetBytes('404'); $res.OutputStream.Write($bytes,0,$bytes.Length); $res.Close(); continue }
    $ext=[IO.Path]::GetExtension($path).ToLower(); if($mime.ContainsKey($ext)){$res.ContentType=$mime[$ext]}else{$res.ContentType='application/octet-stream'}
    $fi=Get-Item -LiteralPath $path; $start=0L; $end=$fi.Length-1; $range=$req.Headers['Range']
    if($range -match '^bytes=(\d*)-(\d*)$'){
      if($matches[1] -ne ''){$start=[int64]$matches[1]}; if($matches[2] -ne ''){$end=[int64]$matches[2]}; if($end -ge $fi.Length){$end=$fi.Length-1}; if($start -gt $end){$res.StatusCode=416;$res.Close();continue}
      $res.StatusCode=206; $res.AddHeader('Content-Range',"bytes $start-$end/$($fi.Length)")
    }
    $res.AddHeader('Accept-Ranges','bytes'); $len=$end-$start+1; $res.ContentLength64=$len
    $fs=[IO.File]::OpenRead($path); $fs.Seek($start,[IO.SeekOrigin]::Begin)|Out-Null; $buf=New-Object byte[] 65536; $left=$len
    while($left -gt 0){$n=$fs.Read($buf,0,[Math]::Min($buf.Length,[int]$left));if($n -le 0){break};$res.OutputStream.Write($buf,0,$n);$left-=$n}
    $fs.Close();$res.OutputStream.Close();$res.Close()
  } catch { try{$ctx.Response.Abort()}catch{} }
}
