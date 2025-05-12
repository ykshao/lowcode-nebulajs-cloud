pipeline {
    agent any
    stages {
        stage('Build') {
            steps {
                echo 'Building nodejs app...'
                sh 'npm install'
            }
        }

        stage('Publish') {
            steps {
                script {
                    echo 'Restart nodejs app...'
                    try{
                        sh 'pm2 delete nebulajs-cloud'
                    } catch (err) {
                         echo 'pm2 delete app failed.'
                    }
                    sh 'pm2 start ecosystem.config.js --env dev'
                }
            }
        }
    }

}
