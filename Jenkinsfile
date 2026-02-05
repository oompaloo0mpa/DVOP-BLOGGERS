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
                subject: "${env.JOB_NAME} - Build #${env.BUILD_NUMBER} - SUCCESS!",
                body: """
                    <html>
                        <body>
                            <h2 style="color: green;">Build Successful! ✓</h2>
                            <p><strong>Project:</strong> ${env.JOB_NAME}</p>
                            <p><strong>Build Number:</strong> ${env.BUILD_NUMBER}</p>
                            <p><strong>Status:</strong> <span style="color: green; font-weight: bold;">SUCCESS</span></p>
                            <p><strong>Duration:</strong> ${currentBuild.durationString}</p>
                            <p><strong>Started By:</strong> ${currentBuild.getBuildCauses()[0].shortDescription}</p>
                            <hr>
                            <p><strong>Changes:</strong></p>
                            <ul>
                                ${getChangeString()}
                            </ul>
                            <hr>
                            <p>Check console output at <a href="${env.BUILD_URL}">${env.BUILD_URL}</a> to view the results.</p>
                            <p>View coverage report at <a href="${env.BUILD_URL}Coverage_Report/">${env.BUILD_URL}Coverage_Report/</a></p>
                        </body>
                    </html>
                """,
                mimeType: 'text/html',
                to: "${env.RECIPIENT_EMAIL}",
                from: 'jenkins@dvop-bloggers.com',
                replyTo: 'noreply@dvop-bloggers.com'
            )
        }
        
        failure {
            echo 'Build failed! Sending failure email...'
            emailext(
                subject: "${env.JOB_NAME} - Build #${env.BUILD_NUMBER} - FAILURE!",
                body: """
                    <html>
                        <body>
                            <h2 style="color: red;">Build Failed! ✗</h2>
                            <p><strong>Project:</strong> ${env.JOB_NAME}</p>
                            <p><strong>Build Number:</strong> ${env.BUILD_NUMBER}</p>
                            <p><strong>Status:</strong> <span style="color: red; font-weight: bold;">FAILURE</span></p>
                            <p><strong>Duration:</strong> ${currentBuild.durationString}</p>
                            <p><strong>Started By:</strong> ${currentBuild.getBuildCauses()[0].shortDescription}</p>
                            <hr>
                            <p><strong>Failed Stage:</strong> ${env.STAGE_NAME ?: 'Unknown'}</p>
                            <p><strong>Changes:</strong></p>
                            <ul>
                                ${getChangeString()}
                            </ul>
                            <hr>
                            <p style="color: red; font-weight: bold;">Action Required: Please check the build logs and fix the issues.</p>
                            <p>Check console output at <a href="${env.BUILD_URL}console">${env.BUILD_URL}console</a> to view the full error details.</p>
                        </body>
                    </html>
                """,
                mimeType: 'text/html',
                to: "${env.RECIPIENT_EMAIL}",
                from: 'jenkins@dvop-bloggers.com',
                replyTo: 'noreply@dvop-bloggers.com',
                attachLog: true
            )
        }
        
        unstable {
            echo 'Build unstable! Sending warning email...'
            emailext(
                subject: "${env.JOB_NAME} - Build #${env.BUILD_NUMBER} - UNSTABLE",
                body: """
                    <html>
                        <body>
                            <h2 style="color: orange;">Build Unstable! ⚠</h2>
                            <p><strong>Project:</strong> ${env.JOB_NAME}</p>
                            <p><strong>Build Number:</strong> ${env.BUILD_NUMBER}</p>
                            <p><strong>Status:</strong> <span style="color: orange; font-weight: bold;">UNSTABLE</span></p>
                            <p><strong>Duration:</strong> ${currentBuild.durationString}</p>
                            <hr>
                            <p>The build completed but some tests may have failed or there are warnings.</p>
                            <p>Check console output at <a href="${env.BUILD_URL}">${env.BUILD_URL}</a> to view the results.</p>
                        </body>
                    </html>
                """,
                mimeType: 'text/html',
                to: "${env.RECIPIENT_EMAIL}",
                from: 'jenkins@dvop-bloggers.com',
                replyTo: 'noreply@dvop-bloggers.com'
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
