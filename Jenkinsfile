node {
  checkout scm

  String registry = 'docker.darklight.ai'
  String product = 'opencti'
  String branch = "${env.BRANCH_NAME}"
  String commit = "${sh(returnStdout: true, script: 'git rev-parse HEAD')}"
  String commitMessage = "${env.COMMIT_MESSAGE}"
  String tag = 'latest'
  String graphql = 'https://cyio.darklight.ai/graphql'
  String api = 'api'

  stage('Setup') {
    // Note: The default settings are configured for the master/main branch
    switch (branch) {
      case 'master':
      case 'main':
        break
      case 'staging':
        tag = branch
        graphql = 'https://cyio-staging.darklight.ai/graphql'
        api = 'api-staging'
        break
      case 'develop':
      default:
        tag = branch
        graphql = 'https://cyio-dev.darklight.ai/graphql'
        api = 'api-dev'

        // Check if it's a PR
        if (env.CHANGE_ID != null && !env.CHANGE_ID.isEmpty()) {
          tag = 'PR' + env.CHANGE_ID
          println "New PR detected, tagging with ${tag}"
          break
        }

        // Check for the build flag in the commit message
        if (branch != 'develop' && (!commitMessage.contains('ci-build') || commitMessage.contains('ci-skip'))) {
          currentBuild.result = 'ABORTED'
          error('Skipping build...')
        }
        break
    }

    println "Commit: ${commit}"

    dir('opencti-platform') {
      dir('opencti-graphql') {
        if (fileExists('config/schema/compiled.graphql')) {
          sh 'rm config/schema/compiled.graphql'
        }
        sh 'yarn install'
      }
      dir('opencti-front') {
        dir('src/relay') {
          sh "sed -i 's|\${hostUrl}/graphql|${graphql}|g' environmentDarkLight.js"
        }
        sh "sed -i 's|https://api-dev.|https://${api}.|g' package.json"
        sh 'yarn install && yarn schema-compile'
      }
    }
  }

  parallel test: {
    stage('Test') {
      try {
        sh(returnStdout: true, script: 'printenv')

        dir('opencti-worker/src') {
          sh 'pip install --no-cache-dir -r requirements.txt'
          sh 'pip install --upgrade --force --no-cache-dir git+https://github.com/OpenCTI-Platform/client-python@master'
        }

        dir('opencti-platform') {
          dir('opencti-graphql') {
            sh 'yarn test'
          }
          dir('opencti-front') {
            sh 'yarn test'
          }
        }
      } catch(Exception e) {
        // NO-OP
      }
    }
  }, build: {
    stage('Build') {
      dir('opencti-platform') {
        String buildArgs = '--no-cache --progress=plain .'
        docker_steps(registry, product, tag, buildArgs)
      }
    }

    office365ConnectorSend(
      status: 'Completed',
      color: '00FF00',
      webhookUrl: "${env.TEAMS_DOCKER_HOOK_URL}"
    )
  }
}

void docker_steps(String registry, String image, String tag, String buildArgs) {
  def app = docker.build("${registry}/${image}:${tag}", "${buildArgs}")

  stage('Save') {
    sh "docker save ${registry}/${image}:${tag} | gzip > ${image}.${tag}.tar.gz"
  }

  stage('Archive') {
    archiveArtifacts artifacts: "${image}.${tag}.tar.gz", fingerprint: true, followSymlinks: false
  }

  stage('Push') {
    if (!tag.startsWith('PR')) {
      docker.withRegistry("https://${registry}", 'docker-registry-credentials') {
        app.push("${tag}")
      }
    }
  }

  stage('Clean') {
    sh "docker ps -a | grep Exit | cut -d ' ' -f 1 | xargs docker rm || true"
    sh 'docker system prune --filter "until=336h" -f'
    sh "rm ${image}.${tag}.tar.gz"
  }
}
