module.exports={
  // notifier: require('update-notifier'), //does not buld normally :(
  glob: require('glob'),
  rimraf: require('rimraf'),
  chalk: require('chalk'),
  clui:
    {
      Progress: require('clui').Progress,
      Spinner: require('clui').Spinner,
    }
};
