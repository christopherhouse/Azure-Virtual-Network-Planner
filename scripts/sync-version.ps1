#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Synchronizes version across all project files from VERSION file.

.DESCRIPTION
    Reads the version from the root VERSION file and updates:
    - apps/web/package.json
    - apps/api/pyproject.toml
    
    Can also verify that all versions are in sync (--check mode).

.PARAMETER Check
    Only verify versions are in sync, don't update anything.

.EXAMPLE
    ./scripts/sync-version.ps1
    Updates all version locations from VERSION file.

.EXAMPLE
    ./scripts/sync-version.ps1 -Check
    Verifies all versions match VERSION file (for CI/pre-commit).
#>

param(
    [switch]$Check
)

$ErrorActionPreference = "Stop"

# Resolve paths relative to repo root
$RepoRoot = Split-Path -Parent $PSScriptRoot
$VersionFile = Join-Path $RepoRoot "VERSION"
$PackageJson = Join-Path $RepoRoot "apps/web/package.json"
$PyProjectToml = Join-Path $RepoRoot "apps/api/pyproject.toml"

# Read source of truth version
if (-not (Test-Path $VersionFile)) {
    Write-Error "VERSION file not found at $VersionFile"
    exit 1
}

$Version = (Get-Content $VersionFile -Raw).Trim()
Write-Host "Source version: $Version" -ForegroundColor Cyan

# Track sync status
$AllInSync = $true
$Updates = @()

# Check/update package.json
if (Test-Path $PackageJson) {
    $PackageContent = Get-Content $PackageJson -Raw
    if ($PackageContent -match '"version":\s*"([^"]+)"') {
        $CurrentVersion = $Matches[1]
        if ($CurrentVersion -ne $Version) {
            $AllInSync = $false
            if ($Check) {
                Write-Host "  [MISMATCH] package.json: $CurrentVersion (expected $Version)" -ForegroundColor Red
            } else {
                $NewContent = $PackageContent -replace '"version":\s*"[^"]+"', "`"version`": `"$Version`""
                Set-Content $PackageJson $NewContent -NoNewline
                Write-Host "  [UPDATED] package.json: $CurrentVersion -> $Version" -ForegroundColor Green
            }
        } else {
            Write-Host "  [OK] package.json: $CurrentVersion" -ForegroundColor Green
        }
    }
} else {
    Write-Host "  [SKIP] package.json not found" -ForegroundColor Yellow
}

# Check/update pyproject.toml
if (Test-Path $PyProjectToml) {
    $TomlContent = Get-Content $PyProjectToml -Raw
    if ($TomlContent -match 'version\s*=\s*"([^"]+)"') {
        $CurrentVersion = $Matches[1]
        if ($CurrentVersion -ne $Version) {
            $AllInSync = $false
            if ($Check) {
                Write-Host "  [MISMATCH] pyproject.toml: $CurrentVersion (expected $Version)" -ForegroundColor Red
            } else {
                $NewContent = $TomlContent -replace 'version\s*=\s*"[^"]+"', "version = `"$Version`""
                Set-Content $PyProjectToml $NewContent -NoNewline
                Write-Host "  [UPDATED] pyproject.toml: $CurrentVersion -> $Version" -ForegroundColor Green
            }
        } else {
            Write-Host "  [OK] pyproject.toml: $CurrentVersion" -ForegroundColor Green
        }
    }
} else {
    Write-Host "  [SKIP] pyproject.toml not found" -ForegroundColor Yellow
}

# Summary
Write-Host ""
if ($Check) {
    if ($AllInSync) {
        Write-Host "All versions in sync!" -ForegroundColor Green
        exit 0
    } else {
        Write-Host "Version mismatch detected. Run 'scripts/sync-version.ps1' to fix." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Version sync complete." -ForegroundColor Green
}
