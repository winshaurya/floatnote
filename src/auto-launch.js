import AutoLaunch from 'auto-launch';

const floatNoteAutoLauncher = new AutoLaunch({
  name: 'FloatNote',
  path: process.execPath,
});

floatNoteAutoLauncher.enable();

export default floatNoteAutoLauncher;
