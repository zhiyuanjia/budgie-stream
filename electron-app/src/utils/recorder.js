//import socketIOClient from 'socket.io-client';
const { desktopCapturer, ipcRenderer } = window.require('electron');
//const ENDPOINT = 'localhost:5001';
//const socket = socketIOClient(ENDPOINT);

var audioContext = null;
var context = null;

/**
 * Return all all audio sources
 */

// export const getSources = async () => {
//   desktopCapturer
//     .getSources({ types: ['window', 'screen'] })
//     .then(async (sources) => {
//       return sources;
//     });
// };

export const stopRecording = async () => {
  await context.close();
};

export const startRecording = () => {
  audioContext = window.AudioContext;
  context = new audioContext();
  desktopCapturer.getSources({ types: ['screen'] }).then(async (sources) => {
    for (const source of sources) {
      if (source.name === 'Screen 1') {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              mandatory: {
                chromeMediaSource: 'desktop',
              },
            },
            video: {
              mandatory: {
                chromeMediaSource: 'desktop',
              },
            },
          });
          handleStream(stream);
        } catch (e) {
          console.log(e);
        }
        return;
      }
    }
  });
};

const handleStream = (stream) => {
  const audioTrack = new MediaStream([stream.getTracks()[0]]);
  var audioInput = context.createMediaStreamSource(audioTrack);
  var bufferSize = 2048;
  // create a javascript node
  var recorder = context.createScriptProcessor(bufferSize, 1, 1);
  // specify the processing function
  recorder.onaudioprocess = recorderProcess;
  // connect stream to our recorder
  audioInput.connect(recorder);
  // connect our recorder to the previous destination
  recorder.connect(context.destination);
};

function convertFloat32ToInt16(buffer) {
  let l = buffer.length;
  let buf = new Int16Array(l);
  while (l--) {
    buf[l] = Math.min(1, buffer[l]) * 0x7fff;
  }
  return buf.buffer;
}

function recorderProcess(e) {
  var left = e.inputBuffer.getChannelData(0);
  //socket.emit('audioStream', convertFloat32ToInt16(left));
  ipcRenderer.send('audioStream', convertFloat32ToInt16(left));
}
