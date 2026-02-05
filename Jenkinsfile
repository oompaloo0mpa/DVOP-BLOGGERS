pipeline {
    agent any
    
    environment {
        NODE_ENV = 'test'
        RECIPIENT_EMAIL = 'paperboi1273@gmail.com'
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out code from repository...'
                checkout scm
            }
        }
        
        stage('Install Dependencies') {
            steps {
                echo 'Installing npm dependencies...'
                script {
                    if (isUnix()) {
                        sh 'npm ci'
                    } else {
                        bat 'npm ci'
                    }
                }
            }
        }
        
        stage('Lint') {
            steps {
                echo 'Running linter...'
                script {
                    if (isUnix()) {
                        sh 'npm run lint || echo "Linting completed"'
                    } else {
                        bat 'npm run lint || echo Linting completed'
                    }
                }
            }
        }
        
        stage('Run Backend Tests') {
            steps {
                echo 'Running backend unit tests...'
                script {
                    if (isUnix()) {
                        sh 'npm run test:coverage'
                    } else {
                        bat 'npm run test:coverage'
                    }
                }
            }
            post {
                always {
                    junit '**/coverage/*.xml' // If Jest generates JUnit reports
                    publishHTML(target: [
                        allowMissing: false,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'coverage',
                        reportFiles: 'index.html',
                        reportName: 'Coverage Report'
                    ])
                }
            }
        }
        
        stage('Build Docker Image') {
            steps {
                echo 'Building Docker image...'
                script {
                    if (isUnix()) {
                        sh "docker build -t dvop-bloggers:${BUILD_NUMBER} ."
                    } else {
                        bat "docker build -t dvop-bloggers:${BUILD_NUMBER} ."
                    }
                }
            }
        }
        
        stage('Deploy to Kubernetes') {
            when {
                branch 'main'
            }
            steps {
                echo 'Deploying to Kubernetes...'
                script {
                    if (isUnix()) {
                        sh 'kubectl apply -f deployment.yaml'
                        sh 'kubectl apply -f service.yaml'
                    } else {
                        bat 'kubectl apply -f deployment.yaml'
                        bat 'kubectl apply -f service.yaml'
                    }
                }
            }
        }
    }
    
    post {
        success {
            echo 'Build succeeded! Sending success email...'
            emailext(
                subject: "\$PROJECT_NAME - Build #\$BUILD_NUMBER - SUCCESS!",
                    body: """<html>
                        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd;">
                                <h2 style="color: #28a745; border-bottom: 3px solid #28a745; padding-bottom: 10px;">
                                    ✓ Build Successful!
                                </h2>
                                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                                    <tr>
                                        <td style="padding: 8px; font-weight: bold; width: 150px;">Project:</td>
                                        <td style="padding: 8px;">${env.JOB_NAME}</td>
                                    </tr>
                                    <tr style="background-color: #f9f9f9;">
                                        <td style="padding: 8px; font-weight: bold;">Build Number:</td>
                                        <td style="padding: 8px;">#${env.BUILD_NUMBER}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px; font-weight: bold;">Status:</td>
                                        <td style="padding: 8px;"><span style="color: #28a745; font-weight: bold;">SUCCESS</span></td>
                                    </tr>
                                    <tr style="background-color: #f9f9f9;">
                                        <td style="padding: 8px; font-weight: bold;">Duration:</td>
                                        <td style="padding: 8px;">${currentBuild.durationString.replace(' and counting', '')}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px; font-weight: bold;">Timestamp:</td>
                                        <td style="padding: 8px;">${new Date()}</td>
                                    </tr>
                                </table>
                                <div style="margin: 20px 0; padding: 15px; background-color: #e7f5e7; border-left: 4px solid #28a745;">
                                    <p style="margin: 0;"><strong>Changes:</strong></p>
                                    <ul style="margin: 10px 0;">
                                        ${getChangeString()}
                                    </ul>
                                </div>
                                <div style="margin: 20px 0;">
                                    <a href="${env.BUILD_URL}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin-right: 10px;">View Console Output</a>
                                    <a href="${env.BUILD_URL}Coverage_Report/" style="display: inline-block; padding: 10px 20px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px;">View Coverage Report</a>
                                </div>
                                <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
                                <p style="color: #666; font-size: 12px;">This is an automated message from Jenkins CI/CD Pipeline</p>
                            </div>
                        </body>
                    </html>""",
                mimeType: 'text/html',
                to: 'paperboi1273@gmail.com'
            )
        }
        
        failure {
            echo 'Build failed! Sending failure email...'
            emailext(
                subject: "\$PROJECT_NAME - Build #\$BUILD_NUMBER - FAILURE!",
                    body: """<html>
                        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd;">
                                <h2 style="color: #dc3545; border-bottom: 3px solid #dc3545; padding-bottom: 10px;">
                                    ✗ Build Failed!
                                </h2>
                                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                                    <tr>
                                        <td style="padding: 8px; font-weight: bold; width: 150px;">Project:</td>
                                        <td style="padding: 8px;">${env.JOB_NAME}</td>
                                    </tr>
                                    <tr style="background-color: #f9f9f9;">
                                        <td style="padding: 8px; font-weight: bold;">Build Number:</td>
                                        <td style="padding: 8px;">#${env.BUILD_NUMBER}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px; font-weight: bold;">Status:</td>
                                        <td style="padding: 8px;"><span style="color: #dc3545; font-weight: bold;">FAILURE</span></td>
                                    </tr>
                                    <tr style="background-color: #f9f9f9;">
                                        <td style="padding: 8px; font-weight: bold;">Duration:</td>
                                        <td style="padding: 8px;">${currentBuild.durationString.replace(' and counting', '')}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px; font-weight: bold;">Failed Stage:</td>
                                        <td style="padding: 8px;">${env.STAGE_NAME ?: 'Unknown'}</td>
                                    </tr>
                                </table>
                                <div style="margin: 20px 0; padding: 15px; background-color: #f8d7da; border-left: 4px solid #dc3545;">
                                    <p style="margin: 0; color: #721c24;"><strong>⚠ Action Required!</strong></p>
                                    <p style="margin: 10px 0; color: #721c24;">Please check the build logs and fix the issues immediately.</p>
                                </div>
                                <div style="margin: 20px 0; padding: 15px; background-color: #fff3cd; border-left: 4px solid #ffc107;">
                                    <p style="margin: 0;"><strong>Recent Changes:</strong></p>
                                    <ul style="margin: 10px 0;">
                                        ${getChangeString()}
                                    </ul>
                                </div>
                                <div style="margin: 20px 0;">
                                    <a href="${env.BUILD_URL}console" style="display: inline-block; padding: 10px 20px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px;">View Error Logs</a>
                                </div>
                                <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
                                <p style="color: #666; font-size: 12px;">This is an automated message from Jenkins CI/CD Pipeline</p>
                            </div>
                        </body>
                    </html>""",
                mimeType: 'text/html',
                to: 'paperboi1273@gmail.com',
                attachLog: true
            )
        }
        
        unstable {
            echo 'Build unstable! Sending warning email...'
            emailext(
                subject: "\$PROJECT_NAME - Build #\$BUILD_NUMBER - UNSTABLE",
                    body: """<html>
                        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd;">
                                <h2 style="color: #ffc107; border-bottom: 3px solid #ffc107; padding-bottom: 10px;">
                                    ⚠ Build Unstable!
                                </h2>
                                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                                    <tr>
                                        <td style="padding: 8px; font-weight: bold; width: 150px;">Project:</td>
                                        <td style="padding: 8px;">${env.JOB_NAME}</td>
                                    </tr>
                                    <tr style="background-color: #f9f9f9;">
                                        <td style="padding: 8px; font-weight: bold;">Build Number:</td>
                                        <td style="padding: 8px;">#${env.BUILD_NUMBER}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px; font-weight: bold;">Status:</td>
                                        <td style="padding: 8px;"><span style="color: #ffc107; font-weight: bold;">UNSTABLE</span></td>
                                    </tr>
                                    <tr style="background-color: #f9f9f9;">
                                        <td style="padding: 8px; font-weight: bold;">Duration:</td>
                                        <td style="padding: 8px;">${currentBuild.durationString.replace(' and counting', '')}</td>
                                    </tr>
                                </table>
                                <div style="margin: 20px 0; padding: 15px; background-color: #fff3cd; border-left: 4px solid #ffc107;">
                                    <p style="margin: 0; color: #856404;">The build completed but some tests may have failed or there are warnings.</p>
                                </div>
                                <div style="margin: 20px 0;">
                                    <a href="${env.BUILD_URL}" style="display: inline-block; padding: 10px 20px; background-color: #ffc107; color: #333; text-decoration: none; border-radius: 5px;">View Build Details</a>
                                </div>
                                <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
                                <p style="color: #666; font-size: 12px;">This is an automated message from Jenkins CI/CD Pipeline</p>
                            </div>
                        </body>
                    </html>""",
                mimeType: 'text/html',
                to: 'paperboi1273@gmail.com'
            )
        }
        
        always {
            echo 'Cleaning up workspace...'
            cleanWs()
        }
    }
}

// Helper function to get change log
@NonCPS
def getChangeString() {
    def changeString = ""
    def changeLogSets = currentBuild.changeSets
    
    if (changeLogSets.size() == 0) {
        changeString = "<li>No changes</li>"
    } else {
        for (int i = 0; i < changeLogSets.size(); i++) {
            def entries = changeLogSets[i].items
            for (int j = 0; j < entries.length; j++) {
                def entry = entries[j]
                changeString += "<li><strong>${entry.author}:</strong> ${entry.msg}</li>"
            }
        }
    }
    
    return changeString
}
