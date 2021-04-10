import { Transcript } from './Transcript';

const pendingInits: ConstructorParameters<typeof Transcript>[] = [];
const transcripts: Transcript[] = [];

const ytdt = {
  Transcript,
  init: (...args: ConstructorParameters<typeof Transcript>) => {
    if (window.YT && window.YT.Player) {
      transcripts.push(new Transcript(...args));
    } else {
      pendingInits.push(args);
    }
  },
};

declare global {
  export interface Window {
    ytdt: typeof ytdt,
    onYouTubeIframeAPIReady: () => void
  }
}

const oldOnYouTubeIframeAPIReady = window.onYouTubeIframeAPIReady;
window.onYouTubeIframeAPIReady = function () {
  if (oldOnYouTubeIframeAPIReady) { oldOnYouTubeIframeAPIReady(); }

  for (const pending of pendingInits) {
    ytdt.init.apply(this, pending);
  }
};

if (window.ytdt) {
  console.warn('Namespace already exists; not registering youtube-dynamic-transcripts');
} else {
  window.ytdt = ytdt;
}
