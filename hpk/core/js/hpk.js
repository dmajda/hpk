/* HPK Namespace. */
var HPK = {};

/* ===== GotoBox ===== */

/* Creates a new GotoBox object. */
HPK.GotoBox = function() {
  this._element = $("<input type='text'>")
    .attr("id", "goto-box")
    .keypress(function(event) {
      switch (event.keyCode) {
        case 13: // Enter
          HPK.presentation.gotoSlide($(this).val() - 1);
          HPK.presentation.gotoBox.hide();
          break;
        case 27: // ESC
          HPK.presentation.gotoBox.hide();
          break;
      }
      event.stopPropagation();
    });
  $("body").append(this._element);
}

HPK.GotoBox.prototype = {
  /* Shows, clears and focuses the goto box. */
  show: function() {
    this._element.val("").show().focus();
  },

  /* Hides the goto box. */
  hide: function() {
    this._element.hide();
  }
}

/* ===== CurrentSlideCounter ===== */

/* Creates a new CurrentSlideCounter object. */
HPK.CurrentSlideCounter = function() {
  this._element = $("<div/>").attr("id", "current-slide-counter");
  $("body").append(this._element);
}

HPK.CurrentSlideCounter.prototype = {
  /* Updates the current slide counter. */
  update: function(currentSlideIndex) {
    this._element.text(currentSlideIndex + 1);
  }
}

/* ===== Navigation ===== */

/* Creates a new Navigation object. */
HPK.Navigation = function() {
  this.visible = false;
  this._element = $("<div/>")
    .attr("id", "navigation")
    .append($("<a/>")
      .attr("href", "#")
      .html("&laquo;")
      .click(function(event) {
        HPK.presentation.gotoPrevSlide();
        event.stopPropagation();
      })
    )
    .append("&nbsp;&nbsp;")
    .append($("<a/>")
      .attr("href", "#")
      .html("&raquo;")
      .click(function(event) {
        HPK.presentation.gotoNextSlide();
        event.stopPropagation();
      })
    )
    .mouseover(function() {
      HPK.presentation.navigation.clearHideTimer();
    })
    .mouseout(function() {
      HPK.presentation.navigation.touch();
    })
    .mousemove(function(event) {
      event.stopPropagation();
    })
    .corner("round 15px");
  $("body").append(this._element);
  this._hideTimer = null;
}

HPK.Navigation.prototype = {

  /* Clears the current hiding timer. */
  clearHideTimer: function() {
    if (this._hideTimer) {
      clearTimeout(this._hideTimer);
      this._hideTimer = null;
    }
  },

  /* Clears the current hiding timer and creates a new one. */
  touch: function() {
    this.clearHideTimer();
    this._hideTimer = setTimeout(function() {
      HPK.presentation.navigation.hide();
    }, 5000);
  },

  /* Shows the navigation. */
  show: function() {
    this.visible = true;
    this._element.fadeIn("normal");
    this.touch();
  },

  /* Hides the navigation. */
  hide: function() {
    this.clearHideTimer();
    this._element.fadeOut("normal");
    this.visible = false;
  }
}

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

  this.currentSlideCounter = new HPK.CurrentSlideCounter;
  this.gotoBox = new HPK.GotoBox();
  this.navigation = new HPK.Navigation();
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

  /* Returns current slide as jQuery object. */
  _currentSlide: function() {
    return this._slides.slice(this._currentSlideIndex, this._currentSlideIndex + 1);
  },

  /* Handles document "mousemove" event. */
  _documentMousemove: function(event) {
    if (event.pageY >= 0.8 * $(document).height()) {
      if (!HPK.presentation.navigation.visible) {
        HPK.presentation.navigation.show();
      } else {
        HPK.presentation.navigation.touch();
      }
    } else {
      if (HPK.presentation.navigation.visible) {
        HPK.presentation.navigation.hide();
      }
    }
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
        HPK.presentation.gotoBox.show();
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
    this.currentSlideCounter.update(this._currentSlideIndex);

    this._screenStyleLinks.attr("media", "projection")
    this._projectionStyleLinks.attr("media", "screen");
    /* WebKit does not reflect all changes and needs a little help. */
    if ($.browser.safari) { // Detects Google Chrome too.
      this._screenStyleLinks.attr("disabled", "disabled");
      this._projectionStyleLinks.removeAttr("disabled");
    }

    $(document).mousemove(this._documentMousemove);
    $(document).click(this._documentClick);
    $(document).keypress(this._documentKeypress);

    this._presenting = true;
  },

  /* Ends the presentation. */
  endPresentation: function() {
    if (!this._presenting) { return; }

    this._slides.show();
    this._currentSlideIndex = null;
    this.gotoBox.hide();

    this._screenStyleLinks.attr("media", "screen");
    this._projectionStyleLinks.attr("media", "projection");
    /* WebKit does not reflect all changes and needs a little help. */
    if ($.browser.safari) { // Detects Google Chrome too.
      this._screenStyleLinks.removeAttr("disabled");
      this._projectionStyleLinks.attr("disabled", "disabled");
    }

    $(document).unbind("mousemove", this._documentMousemove);
    $(document).unbind("click", this._documentClick);
    $(document).unbind("keypress", this._documentKeypress);

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

  /* If presenting, moves to the slide with specified index (if there is any). */
  gotoSlide: function(slideIndex) {
    if (this._presenting && slideIndex >= 0 && slideIndex < this._slides.length) {
      this._currentSlide().hide();
      this._currentSlideIndex = slideIndex;
      this._currentSlide().show();
      this.currentSlideCounter.update(this._currentSlideIndex);
    }
  },

  /* If presenting, moves to the next slide (if there is any). */
  gotoNextSlide: function() {
    this.gotoSlide(this._currentSlideIndex + 1);
  },

  /* If presenting, moves to the previous slide (if there is any). */
  gotoPrevSlide: function() {
    this.gotoSlide(this._currentSlideIndex - 1);
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
      } else if (HPK.presentation.isPresenting() && !isFullscreen) {
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

