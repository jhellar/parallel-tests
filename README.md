# Parallel-tests

Simple test runner which allows to run test cases in parallel.

# Example usage

Configuration file:
```json
{
  "testFiles": [
    "test/init.js",
    "test/helloworld/index.js",
    "test/welcome/index.js",
    "test/push/index.js",
    "test/appforms/index.js",
    "test/saml/index.js"
  ],
  "pools": {
    "appium": 1,
    "iosDigger": 1,
    "androidDigger": 1,
    "projectCreation": 1
  },
  "resources": [
    "android-debugCredentials"
  ]
}
```

Init test file:
```javascript
const p = require('parallel-tests');

p.task('Initialise fhc', { result: 'fhc', skipReport: true }, async () =>
  // ...
);

p.task('Initialise qrLog', { result: 'qrLog', skipReport: true }, async () =>
  // ...
);
```

Welcome test file:
```javascript
const p = require('parallel-tests');
const apps = require('./apps');

apps.forEach(app => {
  const credentials = `${app.credentialsType()}Credentials`;

  const options = {
    suite: { requires: 'fhc' },
    project: { requires: 'projectCreation', result: 'welcomeProject', globalResult: true },
    deploy: { requires: 'welcomeProject', result: 'welcomeDeployed', globalResult: true },
    connection: { requires: 'welcomeProject', result: 'connection' },
    credentials: { result: credentials, globalResult: true },
    build: { requires: [credentials, 'connection', `${app.platform}Digger`], result: 'build' },
    test: { requires: ['build', 'welcomeDeployed', `appium`] }
  };

  p.suite(`E2E test for ${app.name}`, options.suite, () => {

    p.task('Create project', options.project, async () =>
      // ...
    );

    p.task('Deploy cloud app', options.deploy, async proj =>
      // ...
    );

    p.task(`Update connection tag`, options.connection, async proj =>
      // ...
    );

    p.task(`Create credentials bundle`, options.credentials, async () =>
      // ...
    );

    p.task(`Build client app`, options.build, async credentials => {
      // ...
    });

    if (app.buildType !== 'debug' && app.type !== 'native') {
      return;
    }

    p.suite('Test client app', options.test, async () => {

      p.beforeEach(async () =>
        // ...
      );

      p.afterEach(async error => {
        // ...
      });

      p.it('should get response from the cloud', () =>
        // ...
      );

      p.it('should save value to Data Browser', () =>
        // ...
      );

      if (app.cordova) {
        p.it('should get location', () =>
          // ...
        );

        p.it('should open the rest of pages', () =>
          // ...
        );
      }

      p.after(async () =>
        // ...
      );

    });

  });
});
```
