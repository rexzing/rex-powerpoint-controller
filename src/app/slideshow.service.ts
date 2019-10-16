import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SlideshowService {
  slideshow: any;
  constructor() {
    this.slideshow = (<any>window).require('slideshow');
  }

  async openPowerpoint() {
    await this.slideshow.boot().then(function () { this.slideshow.open("ioi.pptx") });
  }

}
