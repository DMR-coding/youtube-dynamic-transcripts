/// <reference types="@types/youtube" />
/* global YT */
import {
  get, isWithinParentViewport, toggleClass,
} from './utility';
import { Caption } from './Caption';

const LOADING = 'Loading transcript...';
const FAILED_LOAD = '⚠️ Could not load transcript.';

const OPEN_ME = 'Open Transcript';
const CLOSE_ME = 'Close Transcript';

const TRANSCRIPT_URL = 'https://video.google.com/timedtext?v=';

export class Transcript {
  private player: YT.Player;

  private captionTimeout?: number;

  private currentCaption?: Caption;

  private captions: Caption[] = [];

  private videoID: string;

  private captionBox: HTMLElement;

  private toggler: HTMLElement;

  private container: HTMLElement;

  constructor(videoID: string, lang: string, transcriptName: string) {
    this.videoID = videoID;

    let url = TRANSCRIPT_URL + videoID;

    if (lang) {
      url += `&lang=${lang}`;
    }

    if (transcriptName) {
      url += `&name=${transcriptName}`;
    }

    this.appendContainer();
    this.loadCaptions(url);

    this.player = new YT.Player(videoID, {
      videoId: videoID,
      events: { onStateChange: this.onStateChange },
    });
  }

  loadCaptions = (captionsURL: string) => {
    get(captionsURL).then(this.captionsLoaded).catch(this.captionsFailed);

    this.captionBox.textContent = LOADING;
  }

  captionsLoaded = (captions: Document) => {
    const xmlCaptions = captions.getElementsByTagName('text');

    this.captionBox.textContent = '';

    for (let i = 0; i < xmlCaptions.length; i += 1) {
      const start: number = +xmlCaptions[i].getAttribute('start');
      const end: number = +xmlCaptions[i].getAttribute('dur') + start;
      const caption = new Caption(start, end, xmlCaptions[i].textContent);

      caption.domElement.addEventListener('click', () => {
        this.seekToIndex(i);
      });

      this.captions.push(caption);
      this.captionBox.append(caption.domElement);
      this.captionBox.scrollTo(0, 0);
    }
  }

  seekToIndex = (i: number) => {
    const caption = this.captions[i];

    this.player.seekTo(caption.start, true);
  }

  captionsFailed = () => {
    this.captionBox.textContent = FAILED_LOAD;
  }

  onStateChange = (event: YT.OnStateChangeEvent) => {
    if (event.data === YT.PlayerState.PLAYING) {
      this.started();
    } else {
      this.stopped();
    }
  }

  started = () => {
    this.highlightCurrentCaption();
  }

  stopped = () => {
    this.removeCurrentHighlight();
    this.clearTimeout();
  }

  highlightCurrentCaption = () => {
    this.removeCurrentHighlight();

    const currentTime = this.player.getCurrentTime();
    this.currentCaption = this.captions.find(
      (caption) => caption.start <= currentTime && caption.end > currentTime,
    );

    if (this.currentCaption) {
      toggleClass(this.currentCaption.domElement, 'highlight', true);

      if (!isWithinParentViewport(this.currentCaption.domElement)) {
        // Defer this so that it'll take effect after the page gets updated with the highlight class
        setTimeout(() => {
          this.currentCaption.domElement.scrollIntoView();
        }, 0);
      }
    }

    this.waitForNextCaption();
  }

  waitForNextCaption = () => {
    this.clearTimeout();
    const currentTime = this.player.getCurrentTime();
    const nextCaption = this.captions.find((caption) => caption.start > currentTime);

    if (nextCaption) {
      const secondsUntil = nextCaption.start - currentTime;
      this.captionTimeout = setTimeout(this.highlightCurrentCaption, secondsUntil * 1000);
    }
  }

  private clearTimeout = () => {
    if (this.captionTimeout) {
      clearTimeout(this.captionTimeout);
    }
    this.captionTimeout = null;
  }

  appendContainer= () => {
    this.container = document.createElement('div');
    this.container.className = 'ytdt';

    this.toggler = document.createElement('button');
    this.toggler.className = 'toggle closed';
    this.toggler.addEventListener('click', this.toggle);
    this.toggler.textContent = OPEN_ME;
    this.container.append(this.toggler);

    this.captionBox = document.createElement('div');
    this.captionBox.className = 'captions closed';
    this.container.append(this.captionBox);

    document.getElementById(this.videoID).after(this.container);
  }

  toggle = () => {
    toggleClass(this.toggler, 'closed');
    toggleClass(this.toggler, 'open');

    toggleClass(this.captionBox, 'closed');
    toggleClass(this.captionBox, 'open');

    if (this.toggler.className.indexOf('closed') > -1) {
      this.toggler.textContent = OPEN_ME;
    } else {
      this.toggler.textContent = CLOSE_ME;
    }
  }

  removeCurrentHighlight = () => {
    if (this.currentCaption) {
      toggleClass(this.currentCaption.domElement, 'highlight', false);
      this.currentCaption = null;
    }
  }
}
