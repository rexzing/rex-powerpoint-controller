import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'rex-powerpoint-controller';
  note: string;
  notesList: any;
  showslideHolder: any;
  fileToUpload: any;

  async openPresentation() {
    console.log("Opening a presentation");
<<<<<<< HEAD

    const Slideshow = (<any>window).require('rexslideshow');
    const slideshow = new Slideshow("powerpoint");
    const filepath = this.fileToUpload.path;
    await slideshow.boot().then(function () { slideshow.open(filepath) }).then(function () { slideshow.start() });
=======
    
    const Slideshow = (<any>window).require('rexslideshow');
    const slideshow = new Slideshow("powerpoint");
    debugger;
    await slideshow.boot().then(function () { slideshow.open("/Users/chamath/Documents/testing/rex-powerpoint-controller/src/app/ioi.pptx") }).then(function () { slideshow.start() });
>>>>>>> bbe573bd16e73e44cc4b260b86880184cccfb0dc
    this.showslideHolder = slideshow;
    let info = await slideshow.info((resp) => { return resp });
    this.notesList = info.notes;
    this.note = this.notesList[0];

  }

  async prevView() {
    this.showslideHolder.prev();
    let stat = await this.showslideHolder.stat();
    this.note = this.notesList[stat.position - 1];
  }

  async nextView() {
    this.showslideHolder.next();
    let stat = await this.showslideHolder.stat();
    this.note = this.notesList[stat.position - 1];
  }

  closeView() {
    let slideshow = this.showslideHolder;
    this.showslideHolder.stop().then(function () { slideshow.close() })
      .then(function () { slideshow.quit() })
      .then(function () { slideshow.end() })
    this.showslideHolder = null;
  }

  handleFileInput(files: FileList) {
    this.fileToUpload = files.item(0);
  }

}
