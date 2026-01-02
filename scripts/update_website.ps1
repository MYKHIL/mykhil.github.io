<#
PowerShell script to update projects.html based on user input.
Prompts for project key (sba-pro-master, ecollation, referee-connect, ibank, exam-analyzer), optional version and optional download URL.
If changes are detected, it will edit projects.html, create a backup, then run git add/commit/push.
#>

param()

function Read-Input([string]$prompt, [string]$default=""){
    if($default -ne ""){
        $val = Read-Host "$prompt [$default]"
        if([string]::IsNullOrWhiteSpace($val)) { return $default }
        return $val
    } else {
        return Read-Host $prompt
    }
}

# Determine absolute script directory and project root explicitly. Using Resolve-Path("..")
# can behave unexpectedly in some hosts; compute the parent path directly instead.
$scriptDir = Split-Path -Path $MyInvocation.MyCommand.Path -Parent
Push-Location -Path $scriptDir | Out-Null
$projectRoot = Split-Path -Path $scriptDir -Parent
Set-Location -Path $projectRoot

$projectsFile = Join-Path -Path (Get-Location) -ChildPath "projects.html"
if(-not (Test-Path -LiteralPath $projectsFile)){
    Write-Host "projects.html not found in $(Get-Location). Aborting." -ForegroundColor Red
    Pop-Location | Out-Null
    exit 1
}

# Load file content
$content = Get-Content -Raw -Path $projectsFile -ErrorAction Stop

# Known project keys and display names (used to locate the version span in HTML)
$projectMap = @{ 
    'sba-pro-master' = 'SBA Pro Master'
    'ecollation' = 'eCollation Center'
    'referee-connect' = 'Referee Connect'
    'ibank' = 'iBank'
    'exam-analyzer' = 'Exam Analyzer'
}

# Use an explicit ordered array of project keys (match previous UI ordering so numbers are stable)
# Order: ibank, ecollation, referee-connect, sba-pro-master, exam-analyzer
$projectKeys = @('ibank','ecollation','referee-connect','sba-pro-master','exam-analyzer')

Write-Host "Select a project to update (leave blank to skip editing projects list):" -ForegroundColor Cyan
$i = 1
$i = 1
foreach($k in $projectKeys){ 
    $display = $projectMap[$k]
    Write-Host "[$i] $k - $display"; $i++ 
}
$sel = Read-Host "Enter number (or press Enter to skip)"
if([string]::IsNullOrWhiteSpace($sel)){
    Write-Host "No project selected. Exiting." -ForegroundColor Yellow
    Pop-Location | Out-Null
    exit 0
}
if(-not ($sel -match '^[0-9]+$')){
    Write-Host "Invalid selection" -ForegroundColor Red
    Pop-Location | Out-Null
    exit 1
}
$idx = [int]$sel - 1
if($idx -lt 0 -or $idx -ge $projectKeys.Count){
    Write-Host "Selection out of range" -ForegroundColor Red
    Pop-Location | Out-Null
    exit 1
}
 $project = $projectKeys[$idx]
if(-not $project){
    Write-Host "Failed to map selection to a project. Exiting." -ForegroundColor Red
    Pop-Location | Out-Null
    exit 1
}
Write-Host "Selected: $project" -ForegroundColor Green

$version = Read-Input "Enter new version (optional)" ""
$url = Read-Input "Enter new download URL (optional)" ""
$updatedDate = Read-Input "Enter new Updated date (optional, e.g. 'Sep 2025')" ""

$modified = $false
$newContent = $content

# Update JS downloadItems url value if provided (this is in the JS object near top of file)
if(-not [string]::IsNullOrWhiteSpace($url)){
    $escapedProject = [regex]::Escape($project)
    # Use singleline mode (?s) so dot matches newlines. Match the object's url property and replace only the URL value.
    $pattern = "(?s)'" + $escapedProject + "'\s*:\s*\{.*?url\s*:\s*'([^']*)'"
    if([regex]::IsMatch($newContent, $pattern)){
        $newContent = [regex]::Replace($newContent, $pattern, { param($m) return $m.Value -replace "url\s*:\s*'[^']*'","url: '$url'" })
        $modified = $true
        Write-Host "Updated download URL for $project" -ForegroundColor Green
    } else {
        Write-Host "Couldn't find download url pattern for $project. Skipping URL update." -ForegroundColor Yellow
    }
}

# Update version span in project card if provided
# We'll perform replacements close to the project's <h3> only, to avoid touching the page header or unrelated areas.
if(-not [string]::IsNullOrWhiteSpace($version)){
    $displayName = $projectMap[$project]
    $escapedDisplay = [regex]::Escape($displayName)
    # Limit search to a small window after the <h3> to avoid spanning large parts of the document
    $pattern2 = '(?s)(<h3>\s*' + $escapedDisplay + '\s*</h3>)(.{0,600}?)(<span class="version">)(.*?)(</span>)'
    if([regex]::IsMatch($newContent, $pattern2)){
    $newContent = [regex]::Replace($newContent, $pattern2, { param($m) return $m.Groups[1].Value + $m.Groups[2].Value + $m.Groups[3].Value + $version + $m.Groups[5].Value })
        $modified = $true
        Write-Host "Updated version for $project to $version" -ForegroundColor Green
    } else {
        Write-Host "Couldn't find version span for $project. Skipping version update." -ForegroundColor Yellow
    }
}

# Also update the version text shown on the homepage index.html (if present)
$indexChanged = $false
if(-not [string]::IsNullOrWhiteSpace($version)){
    $indexFile = Join-Path -Path (Get-Location) -ChildPath "index.html"
    if(Test-Path -LiteralPath $indexFile){
        $indexContent = Get-Content -Raw -LiteralPath $indexFile -ErrorAction SilentlyContinue
        $newIndexContent = $indexContent
        $displayName = $projectMap[$project]
        $escapedDisplay = [regex]::Escape($displayName)
        # Normalize version text to include leading 'v'
        if($version -match '^[vV]') { $versionText = $version } else { $versionText = 'v' + $version }

        # Replace occurrences like: <a ...>SBA Pro Master v6.0.1</a> -> keep link attrs, update inner text
        $patternIndex = '(?s)(<a[^>]*>\s*)' + $escapedDisplay + '(\s*(?:v[^<\r\n]*)?)\s*(</a>)'
        if([regex]::IsMatch($newIndexContent, $patternIndex)){
            $newIndexContent = [regex]::Replace($newIndexContent, $patternIndex, { param($m) return $m.Groups[1].Value + $displayName + ' ' + $versionText + $m.Groups[3].Value })
            if($newIndexContent -ne $indexContent){
                $modified = $true
                $indexChanged = $true
                Write-Host "Updated index.html version text for $project to $versionText" -ForegroundColor Green
            }
        } else {
            Write-Host "Couldn't find '$displayName' link text in index.html. Skipping index update." -ForegroundColor Yellow
        }
    } else {
        Write-Host "index.html not found in $(Get-Location). Skipping index update." -ForegroundColor Yellow
    }
}

# Update the "Updated: ..." date inside the project's stats block (also limited window)
if(-not [string]::IsNullOrWhiteSpace($updatedDate)){
    $displayName = $projectMap[$project]
    $escapedDisplay = [regex]::Escape($displayName)
    # Match from <h3> to the last-updated span within a larger but still limited window
    $patternDate = '(?s)(<h3>\s*' + $escapedDisplay + '\s*</h3>)(.{0,1200}?)(<span class="last-updated">[\s\S]*?Updated:\s*)(.*?)(</span>)'
    if([regex]::IsMatch($newContent, $patternDate)){
        $newContent = [regex]::Replace($newContent, $patternDate, { param($m) return $m.Groups[1].Value + $m.Groups[2].Value + $m.Groups[3].Value + $updatedDate + $m.Groups[5].Value })
        $modified = $true
        Write-Host "Updated 'Updated' date for $project to $updatedDate" -ForegroundColor Green
    } else {
        Write-Host "Couldn't find Updated date span using primary regex; attempting fallback search..." -ForegroundColor Yellow
        # Fallback: find the project's <h3> position and search nearby for 'Updated:' and replace what follows up to </span>
        $h3 = "<h3>" + $displayName + "</h3>"
        $pos = $newContent.IndexOf($h3)
        if($pos -ge 0){
            $start = $pos
            $maxLen = 2000
            $endPos = [math]::Min($newContent.Length, $start + $maxLen)
            $segment = $newContent.Substring($start, $endPos - $start)
            $dateRegex = [regex]"Updated:\s*([^<\r\n]*)"
            $m = $dateRegex.Match($segment)
            if($m.Success){
                $oldDate = $m.Groups[1].Value.Trim()
                $newSegment = $dateRegex.Replace($segment, "Updated: $updatedDate")
                # reconstruct content
                $newContent = $newContent.Substring(0, $start) + $newSegment + $newContent.Substring($endPos)
                $modified = $true
                Write-Host "Fallback: replaced Updated date '$oldDate' with '$updatedDate'" -ForegroundColor Green
            } else {
                Write-Host "Fallback: couldn't locate Updated: text near project header." -ForegroundColor Yellow
            }
        } else {
            Write-Host "Fallback: couldn't find project header in document." -ForegroundColor Yellow
        }
    }
}

if(-not $modified){
    Write-Host "No changes made." -ForegroundColor Yellow
    Pop-Location | Out-Null
    exit 0
}

# Determine which files changed and back them up/write them separately
$projectsChanged = ($newContent -ne $content)
# $indexChanged was set earlier when performing index updates (if any)

if($projectsChanged){
    $projectsBak = "$projectsFile.bak.$((Get-Date).ToString('yyyyMMddHHmmss'))"
    Set-Content -LiteralPath $projectsBak -Value $content -Encoding UTF8
    Write-Host "Backup saved to $projectsBak" -ForegroundColor Cyan
    Set-Content -LiteralPath $projectsFile -Value $newContent -Encoding UTF8
    Write-Host "projects.html updated." -ForegroundColor Green
}

if($indexChanged){
    $indexFile = Join-Path -Path (Get-Location) -ChildPath "index.html"
    $indexBak = "$indexFile.bak.$((Get-Date).ToString('yyyyMMddHHmmss'))"
    Set-Content -LiteralPath $indexBak -Value $indexContent -Encoding UTF8
    Write-Host "Backup saved to $indexBak" -ForegroundColor Cyan
    Set-Content -LiteralPath $indexFile -Value $newIndexContent -Encoding UTF8
    Write-Host "index.html updated." -ForegroundColor Green
}

# Git add/commit/push (stage all changes but exclude backup files)
Write-Host "Staging all changes (new, modified, deleted) ..." -ForegroundColor Cyan
# Stage everything
git add -A | Out-Null

# Unstage backup files (avoid committing any *.bak.* files)
Write-Host "Ensuring backup files are not staged..." -ForegroundColor Cyan
$bakFiles = @()
try {
    $bakFiles = Get-ChildItem -Path (Get-Location) -Recurse -Filter '*.bak.*' -File -ErrorAction SilentlyContinue | ForEach-Object { $_.FullName }
} catch {
    # ignore errors enumerating files
    $bakFiles = @()
}
foreach($b in $bakFiles){
    if(Test-Path -LiteralPath $b){
        git reset -- "$b" 2>$null | Out-Null
        Write-Host "Unstaged backup: $b" -ForegroundColor Yellow
    }
}
$commitMsg = "Update $project"
if(-not [string]::IsNullOrWhiteSpace($version)) { $commitMsg += " version $version" }
if(-not [string]::IsNullOrWhiteSpace($url)) { $commitMsg += " url updated" }

Write-Host "Committing with message: $commitMsg" -ForegroundColor Cyan
$confirm = Read-Host "Commit and push changes? Type 'yes' to proceed"
if($confirm -ieq 'yes'){
    # Determine if there are staged changes
    $staged = ''
    try {
        $staged = (git diff --cached --name-only) -join "`n"
    } catch {
        $staged = ''
    }
    if([string]::IsNullOrWhiteSpace($staged)){
        Write-Host "No staged changes detected. Creating an empty commit so push can proceed." -ForegroundColor Yellow
        git commit --allow-empty -m "$commitMsg" | Out-Null
    } else {
        git commit -m "$commitMsg" | Out-Null
    }
    Write-Host "Pushing to origin main..." -ForegroundColor Cyan
    git push origin main
} else {
    Write-Host "Commit/push cancelled by user." -ForegroundColor Yellow
}

Pop-Location | Out-Null
