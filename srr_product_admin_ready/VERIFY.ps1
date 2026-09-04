$ErrorActionPreference = "Stop"
Write-Host "Checking package files..."
$required = @(
  "database/srr_product_admin_upgrade.sql",
  "app/admin/products/new/page.tsx",
  "app/admin/products/new/ProductCreatePage.module.css",
  "app/api/admin/products/route.ts",
  "app/api/admin/products/upload/route.ts",
  "app/api/products/route.ts",
  "lib/db/srr-admin-db.ts",
  "lib/auth/require-admin.ts",
  "lib/products/product-normalize.mjs"
)
foreach($f in $required){ if(-not (Test-Path (Join-Path $PSScriptRoot $f))){ throw "Missing: $f" } }
Write-Host "OK: package structure complete" -ForegroundColor Green