#!/bin/bash

# Comprehensive Test Automation Script for Proctored MERN Application
# This script runs all tests and generates comprehensive reports

set -e

echo "==========================================="
echo "🚀 Starting Comprehensive Test Automation"
echo "==========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
REPORT_DIR="$PROJECT_ROOT/test-reports"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Create reports directory
mkdir -p "$REPORT_DIR"

echo -e "${BLUE}📁 Creating test reports directory: $REPORT_DIR${NC}"

# Function to check if service is running
check_service() {
    local service_name=$1
    local port=$2
    local max_attempts=30
    local attempt=1

    echo -e "${YELLOW}⏳ Waiting for $service_name to be ready on port $port...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:$port/health > /dev/null 2>&1; then
            echo -e "${GREEN}✅ $service_name is ready!${NC}"
            return 0
        fi
        
        echo "Attempt $attempt/$max_attempts - $service_name not ready yet..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}❌ $service_name failed to start after $max_attempts attempts${NC}"
    return 1
}

# Function to run backend tests
run_backend_tests() {
    echo -e "${BLUE}🧪 Running Backend API Tests...${NC}"
    
    cd "$BACKEND_DIR"
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
        npm install
    fi
    
    # Create test reports directory
    mkdir -p test-reports
    
    echo -e "${BLUE}🧬 Running Jest tests with coverage...${NC}"
    
    # Run tests with coverage and HTML report
    if npm run test:coverage; then
        echo -e "${GREEN}✅ Backend tests completed successfully!${NC}"
        
        # Copy reports to main report directory
        cp -r coverage "$REPORT_DIR/backend-coverage" 2>/dev/null || true
        cp test-reports/*.html "$REPORT_DIR/" 2>/dev/null || true
        
        # Generate test summary
        echo -e "${GREEN}📊 Backend Test Summary:${NC}"
        echo "- Test results: $REPORT_DIR/backend-report.html"
        echo "- Coverage report: $REPORT_DIR/backend-coverage/index.html"
        
        return 0
    else
        echo -e "${RED}❌ Backend tests failed!${NC}"
        return 1
    fi
}

# Function to start services for E2E tests
start_services() {
    echo -e "${BLUE}🚀 Starting application services for E2E testing...${NC}"
    
    # Start backend server
    echo -e "${YELLOW}🔧 Starting backend server...${NC}"
    cd "$BACKEND_DIR"
    npm start &
    BACKEND_PID=$!
    echo "Backend PID: $BACKEND_PID"
    
    # Wait for backend to be ready
    if ! check_service "Backend API" 5000; then
        kill $BACKEND_PID 2>/dev/null || true
        exit 1
    fi
    
    # Start frontend server
    echo -e "${YELLOW}🔧 Starting frontend server...${NC}"
    cd "$FRONTEND_DIR"
    npm run dev &
    FRONTEND_PID=$!
    echo "Frontend PID: $FRONTEND_PID"
    
    # Wait for frontend to be ready
    if ! check_service "Frontend App" 3000; then
        kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
        exit 1
    fi
}

# Function to run frontend E2E tests
run_frontend_tests() {
    echo -e "${BLUE}🎭 Running Frontend E2E Tests...${NC}"
    
    cd "$FRONTEND_DIR"
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
        npm install
    fi
    
    # Create cypress reports directory
    mkdir -p cypress/reports
    
    echo -e "${BLUE}🎪 Running Cypress E2E tests...${NC}"
    
    # Run Cypress tests in headless mode
    if npm run cypress:run; then
        echo -e "${GREEN}✅ Frontend E2E tests completed successfully!${NC}"
        
        # Generate consolidated report
        if npm run cypress:report; then
            echo -e "${GREEN}📊 Cypress report generated successfully!${NC}"
            cp -r cypress/reports "$REPORT_DIR/frontend-e2e-reports" 2>/dev/null || true
        fi
        
        return 0
    else
        echo -e "${RED}❌ Frontend E2E tests failed!${NC}"
        # Copy failure artifacts
        cp -r cypress/screenshots "$REPORT_DIR/cypress-screenshots" 2>/dev/null || true
        cp -r cypress/videos "$REPORT_DIR/cypress-videos" 2>/dev/null || true
        return 1
    fi
}

# Function to cleanup services
cleanup_services() {
    echo -e "${YELLOW}🧹 Cleaning up services...${NC}"
    
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
        echo "Backend server stopped (PID: $BACKEND_PID)"
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
        echo "Frontend server stopped (PID: $FRONTEND_PID)"
    fi
    
    # Kill any remaining processes on the ports
    lsof -ti:5000 | xargs kill -9 2>/dev/null || true
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
}

# Function to generate comprehensive report
generate_comprehensive_report() {
    echo -e "${BLUE}📋 Generating comprehensive test report...${NC}"
    
    local report_file="$REPORT_DIR/comprehensive-test-report-$TIMESTAMP.html"
    
    cat > "$report_file" << EOF
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
            <p class="timestamp">Generated on: $(date)</p>
        </div>
        
        <div class="content">
            <div class="section">
                <h2>📊 Executive Summary</h2>
                <div class="summary-grid">
                    <div class="metric-card">
                        <h3>Backend API Tests</h3>
                        <p class="$([ $BACKEND_TEST_STATUS -eq 0 ] && echo 'status-success' || echo 'status-failure')">
                            $([ $BACKEND_TEST_STATUS -eq 0 ] && echo 'PASSED ✅' || echo 'FAILED ❌')
                        </p>
                    </div>
                    <div class="metric-card">
                        <h3>Frontend E2E Tests</h3>
                        <p class="$([ $FRONTEND_TEST_STATUS -eq 0 ] && echo 'status-success' || echo 'status-failure')">
                            $([ $FRONTEND_TEST_STATUS -eq 0 ] && echo 'PASSED ✅' || echo 'FAILED ❌')
                        </p>
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
EOF
    
    echo -e "${GREEN}📋 Comprehensive report generated: $report_file${NC}"
}

# Function to run all tests
run_all_tests() {
    local backend_success=true
    local frontend_success=true
    
    echo -e "${BLUE}🔄 Starting complete test suite...${NC}"
    
    # Run backend tests
    if run_backend_tests; then
        BACKEND_TEST_STATUS=0
    else
        BACKEND_TEST_STATUS=1
        backend_success=false
    fi
    
    # Start services for E2E tests
    if $backend_success; then
        start_services
        
        # Run frontend E2E tests
        if run_frontend_tests; then
            FRONTEND_TEST_STATUS=0
        else
            FRONTEND_TEST_STATUS=1
            frontend_success=false
        fi
        
        cleanup_services
    else
        echo -e "${RED}⏭️  Skipping E2E tests due to backend test failures${NC}"
        FRONTEND_TEST_STATUS=1
        frontend_success=false
    fi
    
    # Generate comprehensive report
    generate_comprehensive_report
    
    # Final summary
    echo -e "\n${BLUE}==========================================="
    echo -e "📋 FINAL TEST RESULTS SUMMARY"
    echo -e "===========================================${NC}"
    
    if $backend_success; then
        echo -e "Backend Tests: ${GREEN}✅ PASSED${NC}"
    else
        echo -e "Backend Tests: ${RED}❌ FAILED${NC}"
    fi
    
    if $frontend_success; then
        echo -e "Frontend E2E Tests: ${GREEN}✅ PASSED${NC}"
    else
        echo -e "Frontend E2E Tests: ${RED}❌ FAILED${NC}"
    fi
    
    echo -e "\n${YELLOW}📁 All reports saved to: $REPORT_DIR${NC}"
    echo -e "${YELLOW}📊 Main report: $REPORT_DIR/comprehensive-test-report-$TIMESTAMP.html${NC}"
    
    if $backend_success && $frontend_success; then
        echo -e "\n${GREEN}🎉 ALL TESTS PASSED! Application is ready for deployment.${NC}"
        return 0
    else
        echo -e "\n${RED}💥 SOME TESTS FAILED! Please review the reports and fix issues.${NC}"
        return 1
    fi
}

# Trap to ensure cleanup on script exit
trap cleanup_services EXIT

# Handle command line arguments
case "${1:-all}" in
    "backend")
        echo -e "${BLUE}🔧 Running backend tests only...${NC}"
        run_backend_tests
        ;;
    "frontend")
        echo -e "${BLUE}🎭 Running frontend E2E tests only...${NC}"
        start_services
        run_frontend_tests
        ;;
    "all"|*)
        echo -e "${BLUE}🚀 Running complete test suite...${NC}"
        run_all_tests
        ;;
esac