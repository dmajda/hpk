/* HPK Namespace. */
var HPK = {}

/* ===== Presentation ===== */

/* Creates a new Presentation object and injects the presentation mode toggle
   element into the HTML. */
HPK.Presentation = function() {
  /* Opera has its own presentation capabilities, we do not have to help it.
     See http://www.opera.com/browser/tutorials/operashow/. */
  if ($.browser.opera) { return; }

  this._slides = $("div.presentation div.slide");
  this._currentSlideIndex = null;
  this._presenting = false;
  this._screenRules = this._findMediaRules("screen");
  this._projectionRules = this._findMediaRules("projection");

  this._createRunPresentationLink();
}

HPK.Presentation.prototype = {
  /* Finds CSS @media rules with given medium and returns them as an array. */
  _findMediaRules: function(medium) {
    result = [];
    for (var i = 0; i < document.styleSheets.length; i++) {
      var styleSheet = document.styleSheets[i];
      for (var j = 0; j < styleSheet.cssRules.length; j++) {
        var rule = styleSheet.cssRules[j];
        if (!rule instanceof CSSMediaRule) {
          continue;
        }
        if (rule.media.length != 1) {
          continue;
        }

        if (rule.media.item(0) == medium) {
          result.push(rule);
        }
      }
    }
    return result;
  },

  /* Creates the link that enables user to run the presentation. */
  _createRunPresentationLink: function() {
    $("body").append($("<a>")
      .attr("id", "run-presentation-link")
      .attr("href", "#")
      .text(HPK.localizationStrings["runPresentation"])
      .click(function(event) {
        HPK.presentation.beginPresentation();

        /* The following line makes sure that the $(document.click(...) handler
           we setup in the "beginPresentation" will not catch the event. */
        event.stopPropagation();
      })
    );
  },

  /* Changes CSS medium of given rules. */
  _changeRulesMedium: function(rules, fromMedium, toMedium) {
    for (var i = 0; i < rules.length; i++) {
      var media = rules[i].media;
      media.deleteMedium(fromMedium);
      media.appendMedium(toMedium);
    }
  },

  /* Returns current slide as jQuery object. */
  _currentSlide: function() {
    return this._slides.slice(this._currentSlideIndex, this._currentSlideIndex + 1);
  },

  /* Handles document "click" event. */
  _documentClick: function(event) {
    switch (event.which) {
      case 1: // Left button
        HPK.presentation.gotoNextSlideOrEndPresentation();
        return false;
      case 3: // Right button
        HPK.presentation.gotoPrevSlideOrEndPresentation();
        return false;
    }
  },

  /* Handles document "keypress" event. */
  _documentKeypress: function(event) {
    switch (event.which) {
      case 13:  // Enter
      case 32:  // Space
      case 110: // "n"
        HPK.presentation.gotoNextSlideOrEndPresentation();
        return false;

      case 8:   // Backspace
      case 112: // "p"
        HPK.presentation.gotoPrevSlideOrEndPresentation();
        return false;

      case 0:
        switch (event.keyCode) {
          case 34: // Page Down
          case 39: // Right Arrow
          case 40: // Down Arrow
            HPK.presentation.gotoNextSlideOrEndPresentation();
            return false;

          case 33: // Page Up
          case 37: // Left Arrow
          case 38: // Up Arrow
            HPK.presentation.gotoPrevSlideOrEndPresentation();
            return false;

          case 27: // ESC
            HPK.presentation.endPresentation();
            return false;
        }
    }
  },

  /* Are we presenting now? */
  isPresenting: function() {
    return this._presenting;
  },

  /* Begins the presentation. */
  beginPresentation: function() {
    if (this._presenting) { return; }
    if (this._slides.length == 0) { return; }

    this._slides.slice(1).hide();
    this._currentSlideIndex = 0;

    this._changeRulesMedium(this._screenRules, "screen", "projection");
    this._changeRulesMedium(this._projectionRules, "projection", "screen");

    this._oldDocumentKeypressHandler = $(document).keypress(this._documentKeypress);
    this._oldDocumentClickHandler = $(document).click(this._documentClick);

    this._presenting = true;
  },

  /* Ends the presentation. */
  endPresentation: function() {
    if (!this._presenting) { return; }

    this._slides.show();
    this._currentSlideIndex = null;

    this._changeRulesMedium(this._screenRules, "projection", "screen");
    this._changeRulesMedium(this._projectionRules, "screen", "projection");

    $(document).keypress(this._oldDocumentKeypressHandler);
    $(document).click(this._oldDocumentClickHandler);

    this._presenting = false;
  },

  /* Are we on the last slide? */
  isOnFirstSlide: function() {
    return this._presenting
      && this._currentSlideIndex == 0;
  },

  /* Are we on the last slide? */
  isOnLastSlide: function() {
    return this._presenting
      && this._currentSlideIndex == this._slides.length - 1;
  },

  /* If presenting, moves to the next slide (if there is any). */
  gotoNextSlide: function() {
    if (this._presenting && !this.isOnLastSlide()) {
      this._currentSlide().hide();
      this._currentSlideIndex++;
      this._currentSlide().show();
    }
  },

  /* If presenting, moves to the previous slide (if there is any). */
  gotoPrevSlide: function() {
    if (this._presenting && !this.isOnFirstSlide()) {
      this._currentSlide().hide();
      this._currentSlideIndex--;
      this._currentSlide().show();
    }
  },

  /* If presenting, moves to the next slide (if there is any) or ends the
     presentation. */
  gotoNextSlideOrEndPresentation: function() {
    if (this._presenting) {
      if (!this.isOnLastSlide()) {
        this.gotoNextSlide();
      } else {
        this.endPresentation();
      }
    }
  },

  /* If presenting, moves to the previous slide (if there is any) or ends the
     presentation. */
  gotoPrevSlideOrEndPresentation: function() {
    if (this._presenting) {
      if (!this.isOnFirstSlide()) {
        this.gotoPrevSlide();
      } else {
        this.endPresentation();
      }
    }
  },
}

/* ===== Let's roll... ===== */

$(document).ready(function() {
  HPK.presentation = new HPK.Presentation();
});

