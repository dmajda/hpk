/* HPK Namespace. */
var HPK = {}

/* ===== Slide ===== */

/* Creates a new Slide object using specified DOM element as its contents. */
HPK.Slide = function(element) {
  this._element = element;
}

HPK.Slide.prototype = {
  /* Shows the slide. */
  show: function() {
    $(this._element).show();
  },

  /* Hides the slide. */
  hide: function() {
    $(this._element).hide();
  }
}

/* ===== Presentation ===== */

/* Creates a new Presentation object and injects the presentation mode toggle
   element into the HTML. */
HPK.Presentation = function() {
  /* Opera has its own presentation capabilities, we do not have to help it.
     See http://www.opera.com/browser/tutorials/operashow/. */
  if ($.browser.opera) { return; }

  this._slides = this._buildSlides();
  this._currentSlideIndex = null;
  this._inPresentationMode = false;
  this._screenRules = this._findMediaRules("screen");
  this._projectionRules = this._findMediaRules("projection");

  this._injectPresentationModeToggle();
}

HPK.Presentation.prototype = {
  /* Searches the document for slides and builds associated objects. */
  _buildSlides: function() {
    return $("div.presentation div.slide").map(function() {
      return new HPK.Slide(this);
    });
  },

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

  /* Injects the presentation mode toggle element into the HTML. */
  _injectPresentationModeToggle: function() {
    $("body").append($("<a>")
      .attr("id", "presentation-mode-toggle")
      .attr("href", "#")
      .text("Run presentation")
      .click(function(event) {
        HPK.presentation.run();

        /* The following line makes sure that the $(document.click(...) handler
           that we setup in the "enterPresentationMode" will not catch the
           event. */
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

  /* Are we in the presentation mode? */
  isInPresentationMode: function() {
    return this._inPresentationMode;
  },

  /* Handles document "click" event. */
  _documentClick: function(event) {
    switch (event.which) {
      case 1: // Left button
        if (!HPK.presentation.isOnLastSlide()) {
          HPK.presentation.gotoNextSlide();
        } else {
          HPK.presentation.exitPresentationMode();
        }
        return false;
      case 3: // Right button
        if (!HPK.presentation.isOnFirstSlide()) {
          HPK.presentation.gotoPrevSlide();
        } else {
          HPK.presentation.exitPresentationMode();
        }
        return false;
    }
  },

  /* Switches document into the presentation mode. */
  enterPresentationMode: function() {
    if (this._inPresentationMode) { return; }

    if (this._slides.length > 0) {
      for (var i = 1; i < this._slides.length; i++) {
        this._slides[i].hide();
      }
      this._currentSlideIndex = 0;
    }

    this._changeRulesMedium(this._screenRules, "screen", "projection");
    this._changeRulesMedium(this._projectionRules, "projection", "screen");

    this._oldDocumentKeypressHandler = $(document).keypress(function() {
      HPK.presentation.exitPresentationMode();
    });

    this._oldDocumentClickHandler = $(document).click(this._documentClick);

    this._inPresentationMode = true;
  },

  /* Switches document out of the presentation mode. */
  exitPresentationMode: function() {
    if (!this._inPresentationMode) { return; }

    for (var i = 0; i < this._slides.length; i++) {
      this._slides[i].show();
    }
    this._currentSlideIndex = null;

    this._changeRulesMedium(this._screenRules, "projection", "screen");
    this._changeRulesMedium(this._projectionRules, "screen", "projection");

    $(document).keypress(this._oldDocumentKeypressHandler);
    $(document).click(this._oldDocumentClickHandler);

    this._inPresentationMode = false;
  },

  /* Are we on the last slide? */
  isOnFirstSlide: function() {
    return this._inPresentationMode
      && this._currentSlideIndex == 0;
  },

  /* Are we on the last slide? */
  isOnLastSlide: function() {
    return this._inPresentationMode
      && this._currentSlideIndex == this._slides.length - 1;
  },

  /* If the document is in the presentation mode, moves to the next slide (if
     there is any). */
  gotoNextSlide: function() {
    if (this._inPresentationMode && !this.isOnLastSlide()) {
      this._slides[this._currentSlideIndex].hide();
      this._currentSlideIndex++;
      this._slides[this._currentSlideIndex].show();
    }
  },

  /* If the document is in the presentation mode, moves to the previous slide
     (if there is any). */
  gotoPrevSlide: function() {
    if (this._inPresentationMode && !this.isOnFirstSlide()) {
      this._slides[this._currentSlideIndex].hide();
      this._currentSlideIndex--;
      this._slides[this._currentSlideIndex].show();
    }
  },

  /* Runs the presentation (enters the presentation mode). */
  run: function() {
    this.enterPresentationMode();
  },
}

/* ===== Let's roll... ===== */

$(document).ready(function() {
  HPK.presentation = new HPK.Presentation();
});

