# Create deployment zip excluding unnecessary files
$sourcePath = "c:\Users\goenk\Desktop\portalll"
$destPath = "c:\Users\goenk\Desktop\portalll-deployment.zip"

# Remove existing zip if it exists
if (Test-Path $destPath) {
    Remove-Item $destPath -Force
}

# Create a temporary directory for files to zip
$tempPath = "c:\Users\goenk\Desktop\portalll-temp"
if (Test-Path $tempPath) {
    Remove-Item $tempPath -Recurse -Force
}
New-Item -ItemType Directory -Path $tempPath | Out-Null

# Copy files excluding node_modules, .next, .git
Get-ChildItem -Path $sourcePath -Recurse | ForEach-Object {
    $relativePath = $_.FullName.Substring($sourcePath.Length + 1)
    if ($relativePath -notmatch '^node_modules' -and 
        $relativePath -notmatch '^\.next' -and 
        $relativePath -notmatch '^\.git' -and
        $relativePath -notmatch '\.zip$') {
        $destItem = Join-Path $tempPath $relativePath
        $destDir = Split-Path $destItem -Parent
        if (-not (Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }
        Copy-Item $_.FullName -Destination $destItem -Force
    }
}

# Create zip from temp directory
Compress-Archive -Path "$tempPath\*" -DestinationPath $destPath -Force -CompressionLevel Optimal

# Clean up temp directory
Remove-Item $tempPath -Recurse -Force

Write-Host "Deployment zip created at: $destPath"
