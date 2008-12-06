/* HPK Namespace. */
var HPK = {};

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
  this._screenStyleLinks = $("link[rel=stylesheet][media=screen]");
  this._projectionStyleLinks = $("link[rel=stylesheet][media=projection]");

  this._createRunPresentationLink();
  this._createCurrentSlideCounter();
  this._createGotoBox();
}

HPK.Presentation.prototype = {
  /* Creates the link that enables user to run the presentation. */
  _createRunPresentationLink: function() {
    $("body").append($("<a/>")
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

  /* Creates the current slide counter. */
  _createCurrentSlideCounter: function() {
    $("body").append($("<div/>")
      .attr("id", "current-slide-counter")
    );
  },

  /* Updates the current slide counter. */
  _updateCurrentSlideCounter: function() {
    $("#current-slide-counter").text(this._currentSlideIndex + 1);
  },

  /* Creates the "goto box", where the user can specify a slide number he/she
     wants to jump at. */
  _createGotoBox: function() {
    $("body").append($("<input type='text'>")
      .attr("id", "goto-box")
      .keypress(function(event) {
        switch (event.keyCode) {
          case 13: // Enter
            HPK.presentation.gotoSlide($(this).val() - 1);
            HPK.presentation.hideGotoBox();
            break;
          case 27: // ESC
            HPK.presentation.hideGotoBox();
            break;
        }
        event.stopPropagation();
      })
    );
  },

  /* Shows, clears and focuses the "goto box". */
  showGotoBox: function() {
    $("#goto-box").val("").show().focus();
  },

  /* Hides the "goto box". */
  hideGotoBox: function() {
    $("#goto-box").hide();
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

      case 103: // "g"
        HPK.presentation.showGotoBox();
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
    this._updateCurrentSlideCounter();

    this._screenStyleLinks.attr("media", "projection")
    this._projectionStyleLinks.attr("media", "screen");
    /* WebKit does not reflect all changes and needs a little help. */
    if ($.browser.safari) { // Detects Google Chrome too.
      this._screenStyleLinks.attr("disabled", "disabled");
      this._projectionStyleLinks.removeAttr("disabled");
    }

    $(document).keypress(this._documentKeypress);
    $(document).click(this._documentClick);

    this._presenting = true;
  },

  /* Ends the presentation. */
  endPresentation: function() {
    if (!this._presenting) { return; }

    this._slides.show();
    this._currentSlideIndex = null;
    this.hideGotoBox();

    this._screenStyleLinks.attr("media", "screen");
    this._projectionStyleLinks.attr("media", "projection");
    /* WebKit does not reflect all changes and needs a little help. */
    if ($.browser.safari) { // Detects Google Chrome too.
      this._screenStyleLinks.removeAttr("disabled");
      this._projectionStyleLinks.attr("disabled", "disabled");
    }

    $(document).unbind("keypress", this._documentKeypress);
    $(document).unbind("click", this._documentClick);

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
      this._updateCurrentSlideCounter();
    }
  },

  /* If presenting, moves to the previous slide (if there is any). */
  gotoPrevSlide: function() {
    if (this._presenting && !this.isOnFirstSlide()) {
      this._currentSlide().hide();
      this._currentSlideIndex--;
      this._currentSlide().show();
      this._updateCurrentSlideCounter();
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

  /* If presenting, moves to the slide with specified index (if there is any). */
  gotoSlide: function(slideIndex) {
    if (this._presenting && slideIndex >= 0 && slideIndex < this._slides.length) {
      this._currentSlide().hide();
      this._currentSlideIndex = slideIndex;
      this._currentSlide().show();
      this._updateCurrentSlideCounter();
    }
  }
}

/* ===== Let's roll... ===== */

$(document).ready(function() {
  HPK.presentation = new HPK.Presentation();

  if (!$.browser.opera) {
    $(window).bind("resize", function() {
      /* In IE, the document dimensions are actually larger than the screen
         dimensions in the fullscreen view. On the other hand, Firefox has
         a small bar at the top. */
      var isFullscreen = $(document).width() >= screen.width
        && screen.height - $(document).height() <= 10;

      if (!HPK.presentation.isPresenting() && isFullscreen) {
        HPK.presentation.beginPresentation();
      }
      if (HPK.presentation.isPresenting() && !isFullscreen) {
        HPK.presentation.endPresentation();
      }
    });
  }

  var matches = document.location.hash.match(/^#slide-(\d+)$/);
  if (matches) {
    HPK.presentation.beginPresentation();
    HPK.presentation.gotoSlide(parseInt(matches[1]) - 1);
  }
});

