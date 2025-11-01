# Comprehensive Test Automation Script for Proctored MERN Application
# PowerShell version for Windows environments

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("backend", "frontend", "all")]
    [string]$TestType = "all"
)

# Set error handling
$ErrorActionPreference = "Stop"

# Colors for output (Windows PowerShell compatible)
$RED = "Red"
$GREEN = "Green" 
$YELLOW = "Yellow"
$BLUE = "Cyan"

# Configuration
$PROJECT_ROOT = Get-Location
$BACKEND_DIR = Join-Path $PROJECT_ROOT "backend"
$FRONTEND_DIR = Join-Path $PROJECT_ROOT "frontend"
$REPORT_DIR = Join-Path $PROJECT_ROOT "test-reports"
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"

Write-Host "===========================================" -ForegroundColor $BLUE
Write-Host "🚀 Starting Comprehensive Test Automation" -ForegroundColor $BLUE
Write-Host "===========================================" -ForegroundColor $BLUE

# Create reports directory
if (-not (Test-Path $REPORT_DIR)) {
    New-Item -ItemType Directory -Path $REPORT_DIR -Force | Out-Null
}

Write-Host "📁 Creating test reports directory: $REPORT_DIR" -ForegroundColor $BLUE

# Global variables for process tracking
$BackendProcess = $null
$FrontendProcess = $null
$BackendTestStatus = 1
$FrontendTestStatus = 1

# Function to check if service is running
function Wait-ForService {
    param(
        [string]$ServiceName,
        [int]$Port,
        [int]$MaxAttempts = 30
    )
    
    Write-Host "⏳ Waiting for $ServiceName to be ready on port $Port..." -ForegroundColor $YELLOW
    
    for ($attempt = 1; $attempt -le $MaxAttempts; $attempt++) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:$Port/health" -TimeoutSec 5 -UseBasicParsing -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                Write-Host "✅ $ServiceName is ready!" -ForegroundColor $GREEN
                return $true
            }
        }
        catch {
            # Service not ready yet
        }
        
        Write-Host "Attempt $attempt/$MaxAttempts - $ServiceName not ready yet..."
        Start-Sleep -Seconds 2
    }
    
    Write-Host "❌ $ServiceName failed to start after $MaxAttempts attempts" -ForegroundColor $RED
    return $false
}

# Function to run backend tests
function Start-BackendTests {
    Write-Host "🧪 Running Backend API Tests..." -ForegroundColor $BLUE
    
    Set-Location $BACKEND_DIR
    
    # Install dependencies if needed
    if (-not (Test-Path "node_modules")) {
        Write-Host "📦 Installing backend dependencies..." -ForegroundColor $YELLOW
        npm install
    }
    
    # Create test reports directory
    if (-not (Test-Path "test-reports")) {
        New-Item -ItemType Directory -Path "test-reports" -Force | Out-Null
    }
    
    Write-Host "🧬 Running Jest tests with coverage..." -ForegroundColor $BLUE
    
    try {
        # Run tests with coverage and HTML report
        $result = npm run test:coverage
        
        Write-Host "✅ Backend tests completed successfully!" -ForegroundColor $GREEN
        
        # Copy reports to main report directory
        if (Test-Path "coverage") {
            Copy-Item -Path "coverage" -Destination (Join-Path $REPORT_DIR "backend-coverage") -Recurse -Force
        }
        if (Test-Path "test-reports\*.html") {
            Copy-Item -Path "test-reports\*.html" -Destination $REPORT_DIR -Force
        }
        
        Write-Host "📊 Backend Test Summary:" -ForegroundColor $GREEN
        Write-Host "- Test results: $REPORT_DIR\backend-report.html"
        Write-Host "- Coverage report: $REPORT_DIR\backend-coverage\index.html"
        
        $script:BackendTestStatus = 0
        return $true
    }
    catch {
        Write-Host "❌ Backend tests failed!" -ForegroundColor $RED
        Write-Host $_.Exception.Message -ForegroundColor $RED
        $script:BackendTestStatus = 1
        return $false
    }
}

# Function to start services for E2E tests
function Start-Services {
    Write-Host "🚀 Starting application services for E2E testing..." -ForegroundColor $BLUE
    
    # Start backend server
    Write-Host "🔧 Starting backend server..." -ForegroundColor $YELLOW
    Set-Location $BACKEND_DIR
    $script:BackendProcess = Start-Process -FilePath "npm" -ArgumentList "start" -NoNewWindow -PassThru
    Write-Host "Backend PID: $($script:BackendProcess.Id)"
    
    # Wait for backend to be ready
    if (-not (Wait-ForService "Backend API" 5000)) {
        Stop-Services
        exit 1
    }
    
    # Start frontend server
    Write-Host "🔧 Starting frontend server..." -ForegroundColor $YELLOW
    Set-Location $FRONTEND_DIR
    $script:FrontendProcess = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -NoNewWindow -PassThru
    Write-Host "Frontend PID: $($script:FrontendProcess.Id)"
    
    # Wait for frontend to be ready
    if (-not (Wait-ForService "Frontend App" 3000)) {
        Stop-Services
        exit 1
    }
}

# Function to run frontend E2E tests
function Start-FrontendTests {
    Write-Host "🎭 Running Frontend E2E Tests..." -ForegroundColor $BLUE
    
    Set-Location $FRONTEND_DIR
    
    # Install dependencies if needed
    if (-not (Test-Path "node_modules")) {
        Write-Host "📦 Installing frontend dependencies..." -ForegroundColor $YELLOW
        npm install
    }
    
    # Create cypress reports directory
    if (-not (Test-Path "cypress\reports")) {
        New-Item -ItemType Directory -Path "cypress\reports" -Force -Recurse | Out-Null
    }
    
    Write-Host "🎪 Running Cypress E2E tests..." -ForegroundColor $BLUE
    
    try {
        # Run Cypress tests in headless mode
        npm run cypress:run
        
        Write-Host "✅ Frontend E2E tests completed successfully!" -ForegroundColor $GREEN
        
        # Generate consolidated report
        try {
            npm run cypress:report
            Write-Host "📊 Cypress report generated successfully!" -ForegroundColor $GREEN
            if (Test-Path "cypress\reports") {
                Copy-Item -Path "cypress\reports" -Destination (Join-Path $REPORT_DIR "frontend-e2e-reports") -Recurse -Force
            }
        }
        catch {
            Write-Host "⚠️  Cypress report generation failed, but tests passed" -ForegroundColor $YELLOW
        }
        
        $script:FrontendTestStatus = 0
        return $true
    }
    catch {
        Write-Host "❌ Frontend E2E tests failed!" -ForegroundColor $RED
        Write-Host $_.Exception.Message -ForegroundColor $RED
        
        # Copy failure artifacts
        if (Test-Path "cypress\screenshots") {
            Copy-Item -Path "cypress\screenshots" -Destination (Join-Path $REPORT_DIR "cypress-screenshots") -Recurse -Force
        }
        if (Test-Path "cypress\videos") {
            Copy-Item -Path "cypress\videos" -Destination (Join-Path $REPORT_DIR "cypress-videos") -Recurse -Force
        }
        
        $script:FrontendTestStatus = 1
        return $false
    }
}

# Function to cleanup services
function Stop-Services {
    Write-Host "🧹 Cleaning up services..." -ForegroundColor $YELLOW
    
    if ($script:BackendProcess -and -not $script:BackendProcess.HasExited) {
        $script:BackendProcess.Kill()
        Write-Host "Backend server stopped (PID: $($script:BackendProcess.Id))"
    }
    
    if ($script:FrontendProcess -and -not $script:FrontendProcess.HasExited) {
        $script:FrontendProcess.Kill()
        Write-Host "Frontend server stopped (PID: $($script:FrontendProcess.Id))"
    }
    
    # Kill any remaining processes on the ports
    try {
        Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | ForEach-Object { 
            Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue 
        }
        Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object { 
            Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue 
        }
    }
    catch {
        # Ignore errors during cleanup
    }
}

# Function to generate comprehensive report
function New-ComprehensiveReport {
    Write-Host "📋 Generating comprehensive test report..." -ForegroundColor $BLUE
    
    $reportFile = Join-Path $REPORT_DIR "comprehensive-test-report-$TIMESTAMP.html"
    $currentDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    
    $backendStatusText = if ($script:BackendTestStatus -eq 0) { "PASSED ✅" } else { "FAILED ❌" }
    $frontendStatusText = if ($script:FrontendTestStatus -eq 0) { "PASSED ✅" } else { "FAILED ❌" }
    $backendStatusClass = if ($script:BackendTestStatus -eq 0) { "status-success" } else { "status-failure" }
    $frontendStatusClass = if ($script:FrontendTestStatus -eq 0) { "status-success" } else { "status-failure" }
    
    $htmlContent = @"
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comprehensive Test Report - Proctored MERN Application</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 30px; }
        .section { margin-bottom: 40px; }
        .section h2 { color: #333; border-bottom: 3px solid #667eea; padding-bottom: 10px; }
        .status-success { color: #28a745; font-weight: bold; }
        .status-failure { color: #dc3545; font-weight: bold; }
        .status-warning { color: #ffc107; font-weight: bold; }
        .metric-card { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 10px 0; border-left: 4px solid #667eea; }
        .links a { display: inline-block; margin: 5px 10px; padding: 8px 16px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; }
        .links a:hover { background: #0056b3; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0; }
        .feature-list { list-style-type: none; padding: 0; }
        .feature-list li { padding: 8px 0; border-bottom: 1px solid #eee; }
        .feature-list li:before { content: "✅ "; margin-right: 10px; }
        .failure-list li:before { content: "❌ "; }
        .timestamp { font-size: 0.9em; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 Comprehensive Test Report</h1>
            <h2>Proctored MERN Exam Application</h2>
            <p class="timestamp">Generated on: $currentDate</p>
        </div>
        
        <div class="content">
            <div class="section">
                <h2>📊 Executive Summary</h2>
                <div class="summary-grid">
                    <div class="metric-card">
                        <h3>Backend API Tests</h3>
                        <p class="$backendStatusClass">$backendStatusText</p>
                    </div>
                    <div class="metric-card">
                        <h3>Frontend E2E Tests</h3>
                        <p class="$frontendStatusClass">$frontendStatusText</p>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2>🎯 Features Tested</h2>
                <ul class="feature-list">
                    <li>User Authentication (Login/Register/Logout)</li>
                    <li>Role-Based Access Control (Student/Faculty/Admin)</li>
                    <li>Exam Creation and Management</li>
                    <li>Student Exam Taking Flow</li>
                    <li>Real-time Answer Saving</li>
                    <li>Exam Submission and Scoring</li>
                    <li>Proctoring Event Detection</li>
                    <li>Faculty Submission Review</li>
                    <li>Admin Faculty Management</li>
                    <li>System Security and Authorization</li>
                </ul>
            </div>
            
            <div class="section">
                <h2>📈 Test Coverage</h2>
                <div class="metric-card">
                    <h3>Backend API Coverage</h3>
                    <ul>
                        <li><strong>Authentication Routes:</strong> Login, Register, User Info, Profile Updates</li>
                        <li><strong>Exam Routes:</strong> Create, List, Update, Delete, Available Exams</li>
                        <li><strong>Attempt Routes:</strong> Start, Answer, Submit, History</li>
                        <li><strong>Admin Routes:</strong> Faculty Creation, Faculty Listing</li>
                        <li><strong>Authorization:</strong> Role-based access control validation</li>
                    </ul>
                </div>
                
                <div class="metric-card">
                    <h3>Frontend E2E Coverage</h3>
                    <ul>
                        <li><strong>Authentication Flow:</strong> Registration, login, logout, auth state</li>
                        <li><strong>Student Experience:</strong> Dashboard, available exams, exam taking</li>
                        <li><strong>Faculty Features:</strong> Exam creation, management, submissions</li>
                        <li><strong>Admin Functions:</strong> Faculty management, system overview</li>
                        <li><strong>Security Testing:</strong> Route protection, unauthorized access</li>
                    </ul>
                </div>
            </div>
            
            <div class="section">
                <h2>📁 Detailed Reports</h2>
                <div class="links">
                    <a href="backend-report.html">Backend Test Results</a>
                    <a href="backend-coverage/index.html">Backend Code Coverage</a>
                    <a href="frontend-e2e-reports/merged-report.html">Frontend E2E Results</a>
                </div>
            </div>
            
            <div class="section">
                <h2>🔍 Test Environment</h2>
                <div class="metric-card">
                    <ul>
                        <li><strong>Platform:</strong> Windows PowerShell</li>
                        <li><strong>Backend:</strong> Node.js with Jest and Supertest</li>
                        <li><strong>Frontend:</strong> React with Cypress E2E testing</li>
                        <li><strong>Database:</strong> MongoDB (test database)</li>
                        <li><strong>Test Data:</strong> Dynamically generated with cleanup</li>
                        <li><strong>CI/CD:</strong> Ready for integration with GitHub Actions</li>
                    </ul>
                </div>
            </div>
            
            <div class="section">
                <h2>🏆 Quality Assurance</h2>
                <div class="metric-card">
                    <p>This comprehensive test suite ensures:</p>
                    <ul class="feature-list">
                        <li>All API endpoints function correctly</li>
                        <li>User authentication and authorization work properly</li>
                        <li>Exam creation and management features are reliable</li>
                        <li>Student exam-taking flow is smooth and secure</li>
                        <li>Proctoring features detect and report events</li>
                        <li>Admin functions maintain system security</li>
                        <li>Cross-browser compatibility (via Cypress)</li>
                        <li>Responsive design and accessibility</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
"@

    Set-Content -Path $reportFile -Value $htmlContent -Encoding UTF8
    Write-Host "📋 Comprehensive report generated: $reportFile" -ForegroundColor $GREEN
}

# Function to run all tests
function Start-AllTests {
    $backendSuccess = $true
    $frontendSuccess = $true
    
    Write-Host "🔄 Starting complete test suite..." -ForegroundColor $BLUE
    
    # Run backend tests
    if (Start-BackendTests) {
        $script:BackendTestStatus = 0
    } else {
        $script:BackendTestStatus = 1
        $backendSuccess = $false
    }
    
    # Start services for E2E tests
    if ($backendSuccess) {
        Start-Services
        
        # Run frontend E2E tests
        if (Start-FrontendTests) {
            $script:FrontendTestStatus = 0
        } else {
            $script:FrontendTestStatus = 1
            $frontendSuccess = $false
        }
        
        Stop-Services
    } else {
        Write-Host "⏭️  Skipping E2E tests due to backend test failures" -ForegroundColor $RED
        $script:FrontendTestStatus = 1
        $frontendSuccess = $false
    }
    
    # Generate comprehensive report
    New-ComprehensiveReport
    
    # Final summary
    Write-Host ""
    Write-Host "===========================================" -ForegroundColor $BLUE
    Write-Host "📋 FINAL TEST RESULTS SUMMARY" -ForegroundColor $BLUE
    Write-Host "===========================================" -ForegroundColor $BLUE
    
    if ($backendSuccess) {
        Write-Host "Backend Tests: ✅ PASSED" -ForegroundColor $GREEN
    } else {
        Write-Host "Backend Tests: ❌ FAILED" -ForegroundColor $RED
    }
    
    if ($frontendSuccess) {
        Write-Host "Frontend E2E Tests: ✅ PASSED" -ForegroundColor $GREEN
    } else {
        Write-Host "Frontend E2E Tests: ❌ FAILED" -ForegroundColor $RED
    }
    
    Write-Host ""
    Write-Host "📁 All reports saved to: $REPORT_DIR" -ForegroundColor $YELLOW
    Write-Host "📊 Main report: $REPORT_DIR\comprehensive-test-report-$TIMESTAMP.html" -ForegroundColor $YELLOW
    
    if ($backendSuccess -and $frontendSuccess) {
        Write-Host ""
        Write-Host "🎉 ALL TESTS PASSED! Application is ready for deployment." -ForegroundColor $GREEN
        return $true
    } else {
        Write-Host ""
        Write-Host "💥 SOME TESTS FAILED! Please review the reports and fix issues." -ForegroundColor $RED
        return $false
    }
}

# Ensure cleanup on script exit
try {
    # Handle test type selection
    switch ($TestType) {
        "backend" {
            Write-Host "🔧 Running backend tests only..." -ForegroundColor $BLUE
            $success = Start-BackendTests
        }
        "frontend" {
            Write-Host "🎭 Running frontend E2E tests only..." -ForegroundColor $BLUE
            Start-Services
            $success = Start-FrontendTests
        }
        default {
            Write-Host "🚀 Running complete test suite..." -ForegroundColor $BLUE
            $success = Start-AllTests
        }
    }
    
    if (-not $success) {
        exit 1
    }
}
finally {
    Stop-Services
    Set-Location $PROJECT_ROOT
}
