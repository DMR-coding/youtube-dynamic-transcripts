/// <reference types="@types/youtube" />
/* global YT */
import { toggleClass } from './utility';

const LOADING = 'Loading transcript...';
const FAILED_LOAD = '⚠️ Could not load transcript.';

const TRANSCRIPT_URL = 'https://video.google.com/timedtext?v=';

export class Transcript {
  private url: string;

  private player: YT.Player;

  private captionTimeout?: number;

  private captionsLoaded: boolean = false;

  private currentCaption?: HTMLElement;

  constructor(videoID: string, lang: string, transcriptName: string) {
    this.url = TRANSCRIPT_URL + videoID;

    if (lang) {
      this.url += `&lang=${lang}`;
    }

    if (transcriptName) {
      this.url += `&name=${transcriptName}`;
    }

    this.player = new YT.Player(videoID, {
      videoId: videoID,
      events: { onStateChange: this.onStateChange },
    });
  }

  onStateChange = (event: YT.OnStateChangeEvent) => {
    if (event.data === YT.PlayerState.PLAYING) {
      this.started();
    } else {
      this.stopped();
    }
  }

  started = () => {
    if (!this.captionsLoaded) {
      return;
    }

    const currentTime = this.player.getCurrentTime();
    this.highlightCurrentCaption(currentTime);
  }

  stopped = () => {
    if (this.captionTimeout) {
      clearTimeout(this.captionTimeout);
    }
    this.captionTimeout = null;
  }

  highlightCurrentCaption = (elapsedSeconds: number) => {

  }

  removeCurrentHighlight = () => {
    if (this.currentCaption) {
      toggleClass(this.currentCaption, 'highlight', false);
      this.currentCaption = null;
    }
  }
}
