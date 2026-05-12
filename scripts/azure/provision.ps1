param(
    [string]$ResourceGroupName = "vision-checkout-rg",
    [string]$Location = "westeurope",
    [string]$FrontendAppName = "vision-checkout-frontend",
    [string]$BackendAppName = "vision-checkout-backend",
    [string]$AppServicePlanName = "vision-checkout-plan",
    [string]$AdminPassword = "rinkakyu",
    [string]$Repository = "IvanIPZ3/vision-based-self-checkout-kiosk"
)

$ErrorActionPreference = "Stop"

Write-Host "Creating resource group..."
az group create --name $ResourceGroupName --location $Location | Out-Null

Write-Host "Creating App Service plan..."
az appservice plan create `
    --name $AppServicePlanName `
    --resource-group $ResourceGroupName `
    --sku B1 `
    --is-linux | Out-Null

Write-Host "Creating backend App Service..."
az webapp create `
    --name $BackendAppName `
    --resource-group $ResourceGroupName `
    --plan $AppServicePlanName `
    --runtime "PYTHON:3.12" `
    --startup-file "bash /home/site/startup.sh" `
    --https-only true | Out-Null

$backendUrl = "https://$BackendAppName.azurewebsites.net"

Write-Host "Creating Azure Static Web App..."
az staticwebapp create `
    --name $FrontendAppName `
    --resource-group $ResourceGroupName `
    --location $Location `
    --sku Free | Out-Null

$frontendHostname = az staticwebapp show `
    --name $FrontendAppName `
    --resource-group $ResourceGroupName `
    --query "defaultHostname" `
    --output tsv

$frontendUrl = "https://$frontendHostname"
$allowedOrigins = "http://localhost:5173,http://127.0.0.1:5173,$frontendUrl"

Write-Host "Configuring backend app settings..."
az webapp config appsettings set `
    --name $BackendAppName `
    --resource-group $ResourceGroupName `
    --settings `
        SCM_DO_BUILD_DURING_DEPLOYMENT=true `
        ENABLE_ORYX_BUILD=true `
        ALLOWED_ORIGINS="$allowedOrigins" `
        REFERENCE_ADMIN_PASSWORD="$AdminPassword" | Out-Null

az webapp config set `
    --name $BackendAppName `
    --resource-group $ResourceGroupName `
    --startup-file "bash /home/site/startup.sh" `
    --always-on true | Out-Null

Write-Host "Deploying App Service startup script..."
$startupSource = Join-Path $PSScriptRoot "appservice-startup.sh"
$startupTemp = Join-Path $PSScriptRoot "appservice-startup.linux.sh"
$startupContent = Get-Content $startupSource -Raw
$startupContent = $startupContent -replace "`r`n", "`n"
[System.IO.File]::WriteAllText($startupTemp, $startupContent, [System.Text.UTF8Encoding]::new($false))
az webapp deploy `
    --resource-group $ResourceGroupName `
    --name $BackendAppName `
    --src-path $startupTemp `
    --type static `
    --target-path /home/site/startup.sh | Out-Null

Write-Host "Fetching deployment secrets..."
$staticWebAppToken = az staticwebapp secrets list `
    --name $FrontendAppName `
    --resource-group $ResourceGroupName `
    --query "properties.apiKey" `
    --output tsv

Write-Host "Updating GitHub secrets and variables..."
$staticWebAppToken | gh secret set AZURE_STATIC_WEB_APPS_API_TOKEN --repo $Repository
gh variable set AZURE_BACKEND_APP_NAME --body $BackendAppName --repo $Repository
gh variable set AZURE_RESOURCE_GROUP --body $ResourceGroupName --repo $Repository
gh variable set VITE_API_BASE_URL --body $backendUrl --repo $Repository

Write-Host ""
Write-Host "Azure provisioning is complete."
Write-Host "Frontend URL: $frontendUrl"
Write-Host "Backend URL:  $backendUrl"
Write-Host "Static Web Apps token and Azure app variables have been configured."
Write-Host "Ensure GitHub secret AZURE_CREDENTIALS is configured for backend CI/CD."
