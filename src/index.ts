import { Transcript } from './Transcript';

declare global {
  export interface Window {
    ytdt: { Transcript: typeof Transcript };
  } // noqa
}

window.ytdt = window.ytdt || {
  Transcript,
};
