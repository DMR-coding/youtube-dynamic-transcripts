import { Transcript } from './Transcript';

const pendingInits: [string, string, string][] = [];
const transcripts: Transcript[] = [];

const ytdt = {
  Transcript,
  init: (videoId: string, lang: string, name:string) => {
    if (window.YT) {
      transcripts.push(new Transcript(videoId, lang, name));
    } else {
      pendingInits.push([videoId, lang, name]);
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
