const { withProjectBuildGradle } = require('@expo/config-plugins');

/**
 * Config plugin to ensure Android SDK versions are properly set in build.gradle
 * This reads values from gradle.properties (set by expo-build-properties) and
 * makes them available as rootProject.ext.* variables for all modules
 */
module.exports = function withAndroidBuildGradle(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.contents.includes('ext {')) {
      // Already has ext block, don't modify
      return config;
    }

    const buildGradleContent = config.modResults.contents;

    // Find the buildscript block
    const buildscriptRegex = /(buildscript\s*\{)/;

    if (buildscriptRegex.test(buildGradleContent)) {
      const extBlock = `
  ext {
    // Read SDK versions from gradle.properties (set by expo-build-properties plugin)
    buildToolsVersion = findProperty('android.buildToolsVersion') ?: '36.0.0'
    minSdkVersion = (findProperty('android.minSdkVersion') ?: '24').toInteger()
    compileSdkVersion = (findProperty('android.compileSdkVersion') ?: '36').toInteger()
    targetSdkVersion = (findProperty('android.targetSdkVersion') ?: '36').toInteger()
    ndkVersion = findProperty('android.ndkVersion') ?: '27.1.12297006'
    kotlinVersion = findProperty('android.kotlinVersion') ?: '2.1.20'
  }`;

      // Insert ext block right after 'buildscript {'
      config.modResults.contents = buildGradleContent.replace(
        buildscriptRegex,
        `$1${extBlock}`
      );

      // Also update kotlin-gradle-plugin to use the variable
      config.modResults.contents = config.modResults.contents.replace(
        /classpath\(['"]org\.jetbrains\.kotlin:kotlin-gradle-plugin['"]\)/,
        'classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlinVersion")'
      );
    }

    return config;
  });
};
