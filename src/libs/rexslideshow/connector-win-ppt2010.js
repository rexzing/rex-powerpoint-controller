/*
**  slideshow -- Observe and Control Slideshow Applications
**  Copyright (c) 2014-2019 Dr. Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
**
**  File:     connector-win-ppt2010.js
**  Purpose:  connector engine for Microsoft PowerPoint 2010 under Windows
**  Language: WSH/JScript
*/

/*  determine whether application is running  */
var activeApplication = function () {
    var app;
    try {
        app = WScript.CreateObject("PowerPoint.Application");
    }
    catch (e) {
        /*
        **   An abnomal error occors when creating a new powerpoint object. But puwerpoint object has been created successfully.
        */
    }
    return app;
};

/*  determine whether a presentation is active  */
var activePresentation = function (app) {
    var pres = null;
    if (app !== null) {
        try {
            pres = app.ActivePresentation;
        }
        catch (e) {
            pres = null;
        }
    }
    return pres;
};

/*  determine whether slideshow is running  */
var activeSlideshow = function (app) {
    var ss = null;
    if (app !== null) {
        try {
            if (app.SlideShowWindows.Count > 0)
                ss = app.SlideShowWindows.Item(1);
            else
                ss = null;
        }
        catch (e) {
            ss = null;
        }
    }
    return ss;
};

/*  determine current application status  */
var cmdSTAT = function () {
    var app = activeApplication();
    var pres = activePresentation(app);
    var ss = activeSlideshow(app);
    var slideCur;
    if (ss !== null)
        slideCur = ss.View.Slide.SlideIndex;
    else
        slideCur = -1;
    var slideMax = pres !== null ? pres.Slides.Count : -1;
    var state =
        (ss !== null ? "viewing" :
            (pres !== null ? "editing" :
                (app !== null ? "started" :
                    "closed")));
    return "{ \"response\": { " +
        "\"state\": \"" + state + "\", " +
        "\"position\": " + slideCur + ", " +
        "\"clickcount\": " + ss.View.GetClickCount() + ", " +
        "\"last click\": " + ss.View.GetClickIndex() + ", " +
        "\"slides\": " + slideMax + " " +
        "} }";
};

/*  determine information (title & notes) about presentation  */
var cmdINFO = function () {
    var app = activeApplication();
    var pres = activePresentation(app);
    if (pres === null)
        throw new Error("still no active presentation");
    var titles = "";
    var notes = "";
    var slides = pres.Slides;
    for (var i = 1; i <= slides.Count; i++) {
        var slide = slides.Item(i);
        var j, shapes, shape, text;

        /*  determine title  */
        var title = "";
        shapes = slide.Shapes;
        for (j = 1; j <= shapes.Count; j++) {
            shape = shapes.Item(j);
            if (shape.Type === 14 /* msoPlaceholder */) {
                if (shape.PlaceholderFormat.Type === 1 /* ppPlaceholderTitle */ ||
                    shape.PlaceholderFormat.Type === 3 /* ppPlaceholderCenterTitle */) {
                    if (shape.HasTextFrame) {
                        if (shape.TextFrame.HasText) {
                            text = shape.TextFrame.TextRange.Text;
                            text = text.replace(/\s+/g, " ");
                            title += text;
                            break;
                        }
                    }
                }
            }
        }
        if (titles !== "")
            titles += ", ";
        titles += "\"" + title + "\"";

        /*  determine notes  */
        var note = "";
        shapes = slide.NotesPage.Shapes;

        shape = shapes.Item(2);
        if (shape.HasTextFrame) {
            if (shape.TextFrame.HasText) {
                text = shape.TextFrame.TextRange.Text;
                text = text.replace(/\s+/g, " ");
                note += text;
            }
        }

        if (notes !== "")
            notes += ", ";
        notes += "\"" + note + "\"";

    }
    return "{ \"response\": { " +
        "\"titles\": [ " + titles + " ], " +
        "\"notes\": [ " + notes + " ] " +
        "} }";
};

/*  control application  */
var cmdCONTROL = function (cmd, arg) {
    var app = activeApplication();
    var pres = activePresentation(app);
    var ss = activeSlideshow(app);

    /*  sanity check contexts  */
    if (cmd !== "BOOT") {
        if (app === null)
            throw new Error("application still not running");
    }
    if (cmd.match(/(CLOSE|START)$/)) {
        if (pres === null)
            throw new Error("still no active presentation");
    }
    if (cmd.match(/(STOP|PAUSE|RESUME|FIRST|LAST|GOTO|PREV|NEXT)$/)) {
        if (ss === null)
            throw new Error("still no running slideshow");
    }

    /*  dispatch actions  */
    if (cmd === "BOOT" && app !== null)
        app.Visible = true;
    else if (cmd === "QUIT")
        app.Quit();
    else if (cmd === "OPEN") {
        var fso = WScript.CreateObject("Scripting.FileSystemObject");
        fn = fso.GetAbsolutePathName(arg);
        app.Presentations.Open(fn);
    }
    else if (cmd === "CLOSE") {
        pres.Close();
    }
    else if (cmd === "START") {
        pres.SlideShowSettings.ShowType = 1; // set show type to ppShowTypeSpeaker
        pres.SlideShowSettings.ShowPresenterView = false;
        // pres.SlideShowSettings.AdvanceMode = 2; // Automatically after a specified amount of time. Value ppAdvanceOnTime
        pres.SlideShowSettings.ShowWithAnimation = -1;  //  msoTrue
        pres.SlideShowSettings.RangeType = 1; // ppShowAll
        pres.SlideShowSettings.Run();
        app.Windows(1).WindowState = 2; // Minimize the main application
    }
    else if (cmd === "STOP") {
        ss.View.Exit();
    }
    else if (cmd === "PAUSE")
        ss.View.State = 3 /* ppSlideShowBlackScreen */;
    else if (cmd === "RESUME")
        ss.View.GotoSlide(ss.View.CurrentShowPosition);
    else if (cmd === "FIRST")
        ss.View.First();
    else if (cmd === "LAST")
        ss.View.Last();
    else if (cmd === "GOTO")
        ss.View.GotoSlide(parseInt(arg, 10));
    else if (cmd === "PREV")
        ss.View.Previous();
    else if (cmd === "NEXT") {
        if (ss.View.GetClickCount() > ss.View.GetClickIndex())
            ss.View.GotoClick(ss.View.GetClickIndex() + 1);
        else
            ss.View.Next();
    }

    return "{ \"response\": \"OK\" }";
};

/*  main stdin/stdout processing loop  */
while (!WScript.StdIn.AtEndOfStream) {
    /*  read the input request  */
    var line = WScript.StdIn.ReadLine();
    line = line.replace(/^{"command":"(.+?)"}$/, "$1");
    if (line === "" || line === "EXIT")
        break;
    var argv = line.split(/\s+/);
    var cmd = argv[0];
    var arg = "";
    for (i = 1; i < argv.length; i++) {
        arg = arg + argv[i] + " ";
    }

    /*  dispatch command  */
    var out = "";
    try {
        if (cmd === "STAT")
            out = cmdSTAT();
        else if (cmd === "INFO")
            out = cmdINFO();
        else if (cmd.match(/^(BOOT|QUIT|OPEN|CLOSE|START|STOP|PAUSE|RESUME|FIRST|LAST|GOTO|PREV|NEXT)$/))
            out = cmdCONTROL(cmd, arg);
        else
            throw new Error("invalid command: " + cmd);
    }
    catch (error) {
        out = "{ \"error\": \"" + error.message + "\" }";
    }

    /*  write the output response  */
    WScript.StdOut.Write(out + "\n");
}

