# ============================================================
#  sync-avatars.ps1
#  Pulls missing Arknights operator avatars from the
#  PuppiizSunniiz/Arknight-Images repo (its  avatars/  subfolder)
#  into your site repo, then commits + pushes -- but only if
#  something new was actually downloaded.
#  Safe to re-run anytime: files you already have are skipped.
# ============================================================

# ---------------- CONFIG (edit these if needed) -------------
$SourceOwner = "PuppiizSunniiz"     # source repo owner  (note the spelling: ...nniiz)
$SourceRepo  = "Arknight-Images"    # source repo name
$SourcePath  = "avatars"            # subfolder INSIDE the source repo

# Where your repo lives. Default = the folder THIS script sits in,
# so if you drop this file in your repo root you don't need to touch this.
$RepoRoot  = $PSScriptRoot
# If you keep the script somewhere else, comment the line above and
# set the path explicitly, e.g.:
# $RepoRoot = "C:\Users\User\Documents\GitHub\lemonwait.github.io"

# Folder INSIDE your repo where avatars should land:
$TargetDir = Join-Path $RepoRoot "operator\avatars"
# ------------------------------------------------------------

$ErrorActionPreference = "Stop"
$ProgressPreference    = "SilentlyContinue"   # makes downloads much faster
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$headers = @{ "User-Agent" = "sync-avatars" }

Write-Host "Repo root : $RepoRoot"
Write-Host "Target    : $TargetDir"

if (-not (Test-Path $TargetDir)) {
    New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null
}

# 1) Find the source repo's default branch (main vs master) automatically
$repoInfo = Invoke-RestMethod -Uri "https://api.github.com/repos/$SourceOwner/$SourceRepo" -Headers $headers
$branch   = $repoInfo.default_branch
Write-Host "Source branch: $branch"

# 2) List the whole repo tree once, then keep only  avatars/*.png
$treeUrl = "https://api.github.com/repos/$SourceOwner/$SourceRepo/git/trees/$($branch)?recursive=1"
$tree    = Invoke-RestMethod -Uri $treeUrl -Headers $headers
if ($tree.truncated) {
    Write-Warning "GitHub truncated the file list; some avatars may be missed on this run."
}
$remote = $tree.tree | Where-Object { $_.type -eq "blob" -and $_.path -like "$SourcePath/*.png" }
Write-Host "Source has $($remote.Count) avatar file(s)."

# 3) Download only the ones you don't already have
$new = 0
$failed = 0
foreach ($item in $remote) {
    $name = Split-Path $item.path -Leaf
    $dest = Join-Path $TargetDir $name
    if (Test-Path $dest) { continue }          # already have it -> skip

    # URL-encode each path segment (handles '#', spaces, etc.) but keep the slashes
    $encPath = ($item.path -split '/' | ForEach-Object { [Uri]::EscapeDataString($_) }) -join '/'
    $raw = "https://raw.githubusercontent.com/$SourceOwner/$SourceRepo/$branch/$encPath"

    Write-Host "  + $name"
    try {
        Invoke-WebRequest -Uri $raw -OutFile $dest -Headers $headers
        $new++
    } catch {
        Write-Warning "  ! skipped $name  ($($_.Exception.Message))"
        if (Test-Path $dest) { Remove-Item $dest -Force }   # don't leave a broken/empty file behind
        $failed++
    }
}
Write-Host "Downloaded $new new avatar(s).  Failed: $failed."

# 4) Commit + push ONLY if something new was added
if ($new -gt 0) {
    Push-Location $RepoRoot
    try {
        git add -- "operator/avatars"
        git commit -m "Sync Arknights avatars ($(Get-Date -Format 'yyyy-MM-dd')) - $new new"
        git push
        Write-Host "Committed and pushed."
    } finally {
        Pop-Location
    }
} else {
    Write-Host "Nothing new - skipping commit."
}

Write-Host "Done."
