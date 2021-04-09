export class Caption {
  domElement: HTMLElement

  public start: number;

  public end: number;

  constructor(
    start: number,
    end: number,
    text: string,
  ) {
    this.end = end;
    this.start = start;
    this.domElement = document.createElement('a');
    this.domElement.innerHTML = text;
    this.domElement.className = 'caption';
  }
}
